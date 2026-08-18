from flask import Flask, request, jsonify, session
from flask_cors import CORS
import sqlite3
from werkzeug.security import generate_password_hash, check_password_hash

from ocr import extract_text
from question_parser import split_by_questions
from text_cleaner import clean_ocr_text
from rag_pipeline import retrieve_context_for_evaluation

app = Flask(__name__)
import re

app.secret_key = 'scripteval_super_secret_key'
app.config['MAX_CONTENT_LENGTH'] = 500 * 1024 * 1024 
app.config.update(
    SESSION_COOKIE_SAMESITE="None",
    SESSION_COOKIE_SECURE=True,
    SESSION_COOKIE_HTTPONLY=True
)
CORS(app, supports_credentials=True, origins=[re.compile(r"http://(?:127\.0\.0\.1|localhost):\d+")], allow_headers=["Content-Type", "Authorization", "Access-Control-Allow-Credentials"])

def get_db_connection():
    conn = sqlite3.connect('database.db')
    conn.row_factory = sqlite3.Row
    return conn

# Boot initialization tracking
def init_db():
    conn = get_db_connection()
    conn.execute('''CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL
    )''')
    conn.execute('''CREATE TABLE IF NOT EXISTS evaluations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER NOT NULL,
        teacher_id INTEGER NOT NULL,
        score REAL,
        total_marks REAL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES users(id),
        FOREIGN KEY (teacher_id) REFERENCES users(id)
    )''')
    conn.execute('''CREATE TABLE IF NOT EXISTS answers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        evaluation_id INTEGER NOT NULL,
        question_no TEXT NOT NULL,
        student_answer TEXT,
        teacher_answer TEXT,
        score REAL,
        feedback TEXT,
        FOREIGN KEY (evaluation_id) REFERENCES evaluations(id)
    )''')
    
    conn.execute('''CREATE TABLE IF NOT EXISTS events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        date TEXT NOT NULL,
        created_by INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(created_by) REFERENCES users(id)
    )''')
    
    conn.execute('''CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        message TEXT NOT NULL,
        type TEXT NOT NULL,
        is_read BOOLEAN DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id)
    )''')
    
    try:
        conn.execute("ALTER TABLE evaluations ADD COLUMN exam_name TEXT")
    except sqlite3.OperationalError:
        pass
    try:
        conn.execute("ALTER TABLE evaluations ADD COLUMN subject TEXT")
    except sqlite3.OperationalError:
        pass

    conn.commit()
    conn.close()

init_db()

DATA = {
    "student_answers": {},
    "teacher_answers": {},
    "question_marks": {},
    "scores": {},
    "final_score": None,
    "total_marks": 0,
    "feedback": {},
    "feedback_ready": False,
    "student_cleaned_text": ""
}

RAG_DEBUG = {
    "enabled": False,
    "questions": []
}

# ---------------- RESET ----------------
@app.route("/reset", methods=["POST"])
def reset():
    DATA.update({
        "student_answers": {},
        "teacher_answers": {},
        "question_marks": {},
        "scores": {},
        "final_score": None,
        "total_marks": 0,
        "feedback": {},
        "feedback_ready": False,
        "student_cleaned_text": ""
    })
    RAG_DEBUG.update({
        "enabled": False,
        "questions": []
    })
    return jsonify({"status": "reset"})


# ---------------- AUTHENTICATION ----------------
@app.route("/api/signup", methods=["POST"])
def auth_signup():
    data = request.json
    name = data.get("name")
    email = data.get("email")
    password = data.get("password")
    role = data.get("role")

    if not all([name, email, password, role]):
        return jsonify({"error": "Missing fields"}), 400
        
    if role not in ["Teacher", "Student"]:
        return jsonify({"error": "Invalid role"}), 400

    hashed_pw = generate_password_hash(password)
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)",
                       (name, email, hashed_pw, role))
        conn.commit()
        user_id = cursor.lastrowid
        conn.close()
        
        session["user_id"] = user_id
        session["role"] = role
        session["name"] = name
        
        return jsonify({"status": "success", "user": {"id": user_id, "name": name, "email": email, "role": role}})
    except sqlite3.IntegrityError:
        return jsonify({"error": "User with this email already exists"}), 409


@app.route("/api/login", methods=["POST"])
def auth_login():
    data = request.json
    email = data.get("email")
    password = data.get("password")

    conn = get_db_connection()
    user = conn.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()
    conn.close()

    if user and check_password_hash(user["password_hash"], password):
        session["user_id"] = user["id"]
        session["role"] = user["role"]
        session["name"] = user["name"]
        return jsonify({"status": "success", "user": {"id": user["id"], "name": user["name"], "email": user["email"], "role": user["role"]}})
    
    return jsonify({"error": "Invalid credentials"}), 401


@app.route("/api/logout", methods=["POST"])
def auth_logout():
    session.clear()
    return jsonify({"status": "success"})


@app.route("/api/me", methods=["GET"])
def auth_me():
    if "user_id" in session:
        return jsonify({"logged_in": True, "user": {"id": session["user_id"], "name": session["name"], "role": session["role"]}})
    return jsonify({"logged_in": False})


# ---------------- UPLOAD STUDENT ----------------
@app.route("/upload-student", methods=["POST"])
def upload_student():

    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    files = request.files.getlist("file")
    if not files:
        return jsonify({"error": "No file uploaded"}), 400

    image_paths = []
    
    from pdf_utils import extract_images_from_student_pdf
    
    for i, file in enumerate(files):
        if file.filename.lower().endswith('.pdf'):
            pdf_path = f"temp_student_{i}.pdf"
            file.save(pdf_path)
            pdf_images = extract_images_from_student_pdf(pdf_path)
            image_paths.extend(pdf_images)
        else:
            img_path = f"temp_student_{i}.png"
            file.save(img_path)
            image_paths.append(img_path)

    combined_raw_text = ""
    for img_path in image_paths:
        text = extract_text(img_path)
        if text:
            combined_raw_text += text + "\n"

    if not combined_raw_text.strip():
        return jsonify({"error": "OCR failed"}), 400

    cleaned_text = clean_ocr_text(combined_raw_text)
    DATA["student_cleaned_text"] = cleaned_text

    # Initial naive extraction for basic logging
    student_answers, _ = split_by_questions(cleaned_text)
    DATA["student_answers"] = student_answers

    return jsonify({"status": "student_uploaded"})


# ---------------- UPLOAD ANSWER KEY ----------------
@app.route("/upload-key", methods=["POST"])
def upload_key():

    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    files = request.files.getlist("file")
    if not files:
        return jsonify({"error": "No file uploaded"}), 400

    combined_text = ""
    from pdf_utils import extract_text_from_teacher_pdf

    for i, file in enumerate(files):
        if file.filename.lower().endswith('.pdf'):
            key_path = f"temp_teacher_key_{i}.pdf"
            file.save(key_path)
            extracted = extract_text_from_teacher_pdf(key_path)
            if extracted: combined_text += extracted + "\n"
        else:
            extracted = file.read().decode("utf-8", errors="ignore")
            if extracted: combined_text += extracted + "\n"

    teacher_answers, marks_map = split_by_questions(combined_text)

    DATA["teacher_answers"] = teacher_answers
    DATA["question_marks"] = marks_map
    DATA["total_marks"] = sum(marks_map.values())

    subject = request.form.get("subject") or request.form.get("exam_name") or DATA.get("subject") or "general"
    DATA["subject"] = subject

    from rag_ingest import ingest_teacher_answers
    ingest_teacher_answers(teacher_answers, marks_map, subject=subject)

    return jsonify({"status": "key_uploaded"})


# ---------------- EVALUATE ----------------
@app.route("/evaluate", methods=["GET"])
def evaluate():
    try:
        if not DATA.get("student_cleaned_text") or not DATA.get("teacher_answers"):
            return jsonify({
                "ready": False,
                "message": "Upload student answers and answer key first"
            })

        # Reparse student text utilizing hybrid semantic mapping now that teacher bounds are active
        hybrid_answers, _ = split_by_questions(DATA["student_cleaned_text"], DATA["teacher_answers"])
        DATA["student_answers"] = hybrid_answers

        # RAG Context Retrieval
        rag_context = None
        rag_error = None
        try:
            subject = request.args.get("subject") or request.form.get("subject") or DATA.get("subject")
            rag_context = retrieve_context_for_evaluation(
                DATA["student_answers"],
                subject=subject,
                question_texts=DATA.get("teacher_answers")
            )

            # Update RAG debug state
            rag_questions = []
            if rag_context:
                for q_id, docs in rag_context.items():
                    rag_questions.append({
                        "question": q_id,
                        "retrieved_document_count": len(docs) if isinstance(docs, list) else 0,
                        "retrieved_documents": docs,
                        "retrieved_context": [d.get("content", "") for d in docs] if isinstance(docs, list) else []
                    })
                has_docs = any(len(docs) > 0 for docs in rag_context.values()) if rag_context else False
                RAG_DEBUG["enabled"] = has_docs
                RAG_DEBUG["questions"] = rag_questions
            else:
                RAG_DEBUG["enabled"] = False
                RAG_DEBUG["questions"] = []
        except Exception as rag_err:
            rag_error = str(rag_err)
            rag_context = None
            RAG_DEBUG["enabled"] = False
            RAG_DEBUG["questions"] = []

        from llm_feedback import generate_evaluation
        result_json = generate_evaluation(
            DATA["student_answers"], 
            DATA["teacher_answers"], 
            DATA["question_marks"],
            rag_context=rag_context
        )

        if not result_json:
            print("\n" + "-" * 60, flush=True)
            print("ERROR", flush=True)
            print("-" * 60, flush=True)
            print("    Stage   : AI Evaluation", flush=True)
            print("    Status  : ✗ FAILED", flush=True)
            print("    Reason  : Evaluation failed due to API limits or parsing errors", flush=True)
            print("-" * 60 + "\n", flush=True)
            return jsonify({
                "ready": False,
                "message": "Evaluation failed due to API limits or parsing errors"
            })

        import re
        scores = {}
        feedback_dict = {}
        total_scored = result_json.get("total_score", 0)

        for ans in result_json.get("answers", []):
            raw_q_no = str(ans.get("question", ""))
            match = re.search(r'(?:Q|Question)?\s*(\d+)[\).:\s-]*', raw_q_no, re.IGNORECASE)
            q_no = match.group(1) if match else raw_q_no.strip()
            scores[q_no] = ans.get("score", 0)
            feedback_dict[q_no] = ans.get("feedback", "")

        DATA["scores"] = scores
        DATA["final_score"] = total_scored
        DATA["feedback"] = feedback_dict
        DATA["feedback_ready"] = True

        # --- TERMINAL EVALUATION REPORT ---
        sorted_q_keys = sorted(
            DATA["teacher_answers"].keys(),
            key=lambda x: int(x) if str(x).isdigit() else str(x)
        )

        total_marks = DATA.get("total_marks", 0)
        percentage = (float(total_scored) / float(total_marks) * 100.0) if total_marks else 0.0

        print("\n" + "=" * 60, flush=True)
        print("EXAM EVALUATION", flush=True)
        print("=" * 60 + "\n", flush=True)

        print("TEACHER ANSWER KEY\n", flush=True)
        for q in sorted_q_keys:
            q_text = str(DATA["teacher_answers"].get(q, "")).strip().replace("\n", " ")
            print(f"Q{q}: {q_text}", flush=True)

        print("\nMARKS", flush=True)
        for q in sorted_q_keys:
            q_max = DATA["question_marks"].get(q, 0)
            print(f"Q{q}: {q_max}", flush=True)

        print("\nSTUDENT ANSWERS\n", flush=True)
        for q in sorted_q_keys:
            student_ans = str(DATA["student_answers"].get(q, "No answer provided.")).strip().replace("\n", " ")
            print(f"Q{q}: {student_ans}", flush=True)

        print("\nEVALUATION\n", flush=True)
        for q in sorted_q_keys:
            q_score = scores.get(q, 0)
            q_max = DATA["question_marks"].get(q, 0)
            q_fb = feedback_dict.get(q, "").strip().replace("\n", " ")
            print(f"Q{q}: {q_score} / {q_max}", flush=True)
            print(f"    {q_fb}\n", flush=True)

        print(f"FINAL SCORE: {total_scored} / {total_marks}", flush=True)
        print(f"PERCENTAGE: {percentage:.1f}%\n", flush=True)
        print("=" * 60 + "\n", flush=True)

        return jsonify({
            "ready": True,
            "final_score": total_scored,
            "total_marks": DATA["total_marks"],
            "scores": scores,
            "question_marks": DATA["question_marks"],
            "feedback": DATA["feedback"],
            "student_answers": DATA["student_answers"],
            "teacher_answers": DATA["teacher_answers"]
        })
    except Exception as e:
        print("\n" + "-" * 60, flush=True)
        print("ERROR", flush=True)
        print("-" * 60, flush=True)
        print("    Stage   : Evaluation Pipeline", flush=True)
        print("    Status  : ✗ FAILED", flush=True)
        print(f"    Reason  : {str(e)}", flush=True)
        print("-" * 60 + "\n", flush=True)
        return jsonify({"ready": False, "error": str(e)}), 500


# ---------------- RAG DEBUG ----------------
@app.route("/rag-debug", methods=["GET"])
def rag_debug():
    return jsonify(RAG_DEBUG)


# ---------------- GET FEEDBACK ----------------
@app.route("/get-feedback", methods=["GET"])
def get_feedback():

    if DATA["feedback_ready"]:
        return jsonify({
            "ready": True,
            "feedback": DATA["feedback"]
        })

    return jsonify({"ready": False})


# ---------------- RESULT SAVING ----------------
@app.route("/api/save-result", methods=["POST"])
def save_result():
    if session.get("role") != "Teacher":
        return jsonify({"error": "Unauthorized. Only teachers can save results."}), 403

    data = request.json
    student_email = data.get("student_email")
    exam_name = data.get("exam_name", "Untitled Exam")
    subject = data.get("subject", "Uncategorized")
    
    if not student_email:
        return jsonify({"error": "Student email is required strictly linking DB records"}), 400

    conn = get_db_connection()
    student = conn.execute("SELECT id FROM users WHERE email = ? AND role = 'Student'", (student_email,)).fetchone()
    
    if not student:
        print("STUDENT EMAIL:", student_email)
        print("FOUND STUDENT:", student)
        import uuid
        from werkzeug.security import generate_password_hash
        dummy_password = generate_password_hash(str(uuid.uuid4()))
        
        cursor = conn.cursor()
        cursor.execute("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
                       ("Student", student_email, dummy_password, "Student"))
        student_id = cursor.lastrowid
    else:
        student_id = student["id"]
    teacher_id = session["user_id"]
    
    eval_score = DATA.get("final_score", 0)
    eval_total = DATA.get("total_marks", 0)
    
    cursor = conn.cursor()
    cursor.execute("INSERT INTO evaluations (student_id, teacher_id, score, total_marks, exam_name, subject) VALUES (?, ?, ?, ?, ?, ?)",
                   (student_id, teacher_id, eval_score, eval_total, exam_name, subject))
    evaluation_id = cursor.lastrowid

    scores = DATA.get("scores", {})
    feedback = DATA.get("feedback", {})
    s_ans = DATA.get("student_answers", {})
    t_ans = DATA.get("teacher_answers", {})
    
    all_keys = set(list(scores.keys()) + list(feedback.keys()) + list(s_ans.keys()) + list(t_ans.keys()))
    
    for q in all_keys:
        q_score = scores.get(q, 0)
        q_feed = feedback.get(q, "No feedback provided")
        q_student = s_ans.get(q, "No answer provided")
        q_teacher = t_ans.get(q, "No expected answer found")
        
        cursor.execute('''INSERT INTO answers 
            (evaluation_id, question_no, student_answer, teacher_answer, score, feedback)
            VALUES (?, ?, ?, ?, ?, ?)''',
            (evaluation_id, str(q), q_student, q_teacher, q_score, q_feed))
            
    # Add notification for the native student receiving results bounds
    cursor.execute("INSERT INTO notifications (user_id, message, type) VALUES (?, ?, 'result')",
                   (student_id, f"New result uploaded for {exam_name}"))
            
    conn.commit()
    conn.close()
    
    return jsonify({"status": "success"})


# ---------------- STUDENT DASHBOARD ----------------
@app.route("/api/student-results", methods=["GET"])
def get_student_results():
    if session.get("role") != "Student":
        return jsonify({"error": "Unauthorized. Only students can view this dashboard."}), 403

    student_id = session["user_id"]
    conn = get_db_connection()
    
    evals = conn.execute("SELECT e.id, e.exam_name, e.subject, e.score, e.total_marks, e.created_at, u.name as teacher_name FROM evaluations e JOIN users u ON e.teacher_id = u.id WHERE e.student_id = ? ORDER BY e.created_at DESC", (student_id,)).fetchall()
    
    results = []
    for ev in evals:
        eval_id = ev["id"]
        answers = conn.execute("SELECT * FROM answers WHERE evaluation_id = ?", (eval_id,)).fetchall()
        
        ans_list = []
        for a in answers:
            ans_list.append({
                "question_no": a["question_no"],
                "student_answer": a["student_answer"],
                "teacher_answer": a["teacher_answer"],
                "score": a["score"],
                "feedback": a["feedback"]
            })
            
        total_m = ev["total_marks"] or 0
        score_m = ev["score"] or 0
        percentage = round((score_m / total_m) * 100, 2) if total_m > 0 else 0

        results.append({
            "id": eval_id,
            "exam_name": ev["exam_name"],
            "subject": ev["subject"],
            "teacher_name": ev["teacher_name"],
            "score": score_m,
            "total_marks": total_m,
            "percentage": percentage,
            "date": str(ev["created_at"]),
            "details": ans_list
        })
        
    conn.close()
    return jsonify({"status": "success", "results": results})

# ---------------- TEACHER DASHBOARD API ----------------
@app.route("/api/subjects", methods=["GET"])
def get_subjects():
    if session.get("role") != "Teacher":
        return jsonify({"error": "Unauthorized"}), 403
    
    teacher_id = session["user_id"]
    conn = get_db_connection()
    rows = conn.execute("SELECT DISTINCT subject FROM evaluations WHERE teacher_id = ? AND subject IS NOT NULL", (teacher_id,)).fetchall()
    conn.close()
    
    subjects = [r["subject"] for r in rows if r["subject"]]
    return jsonify({"status": "success", "subjects": subjects})

@app.route("/api/teacher-results", methods=["GET"])
def get_teacher_results():
    if session.get("role") != "Teacher":
        return jsonify({"error": "Unauthorized"}), 403

    teacher_id = session["user_id"]
    conn = get_db_connection()
    
    evals = conn.execute("SELECT e.id, e.exam_name, e.subject, e.score, e.total_marks, e.created_at, u.name as student_name, u.email as student_email FROM evaluations e JOIN users u ON e.student_id = u.id WHERE e.teacher_id = ? ORDER BY e.created_at DESC", (teacher_id,)).fetchall()
    
    results = []
    for ev in evals:
        eval_id = ev["id"]
        answers = conn.execute("SELECT * FROM answers WHERE evaluation_id = ?", (eval_id,)).fetchall()
        
        ans_list = []
        for a in answers:
            ans_list.append({
                "question_no": a["question_no"],
                "student_answer": a["student_answer"],
                "teacher_answer": a["teacher_answer"],
                "score": a["score"],
                "feedback": a["feedback"]
            })
            
        results.append({
            "id": eval_id,
            "exam_name": ev["exam_name"],
            "subject": ev["subject"],
            "student_name": ev["student_name"],
            "student_email": ev["student_email"],
            "score": ev["score"],
            "total_marks": ev["total_marks"],
            "date": str(ev["created_at"]),
            "details": ans_list
        })
        
    conn.close()
    return jsonify({"status": "success", "results": results})

# ---------------- EVENTS / CALENDAR API ----------------
@app.route("/api/events", methods=["GET"])
def get_events():
    conn = get_db_connection()
    # Fetch events ordered by date ascending organically
    events = conn.execute("SELECT e.id, e.title, e.description, e.date, u.name as teacher_name FROM events e JOIN users u ON e.created_by = u.id ORDER BY e.date ASC").fetchall()
    conn.close()
    
    events_list = [{
        "id": ev["id"],
        "title": ev["title"],
        "description": ev["description"],
        "date": ev["date"],
        "teacher_name": ev["teacher_name"]
    } for ev in events]
    return jsonify({"status": "success", "events": events_list})

@app.route("/api/events", methods=["POST"])
def create_event():
    if session.get("role") != "Teacher":
        return jsonify({"error": "Unauthorized"}), 403
        
    data = request.json
    title = data.get("title")
    description = data.get("description", "")
    date_val = data.get("date")
    teacher_id = session.get("user_id")
    
    if not title or not date_val:
        return jsonify({"error": "Title and date are legally required bindings"}), 400
        
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("INSERT INTO events (title, description, date, created_by) VALUES (?, ?, ?, ?)", (title, description, date_val, teacher_id))
    event_id = cursor.lastrowid
    
    # Notify all students
    students = conn.execute("SELECT id FROM users WHERE role = 'Student'").fetchall()
    for s in students:
        cursor.execute("INSERT INTO notifications (user_id, message, type) VALUES (?, ?, 'event')", (s["id"], f"New event added: {title}"))
        
    conn.commit()
    conn.close()
    
    return jsonify({"status": "success", "event_id": event_id})

@app.route("/api/events/<int:event_id>", methods=["PUT"])
def update_event(event_id):
    if session.get("role") != "Teacher":
        return jsonify({"error": "Unauthorized"}), 403
        
    data = request.json
    title = data.get("title")
    description = data.get("description", "")
    date_val = data.get("date")
    teacher_id = session.get("user_id")
    
    if not title or not date_val:
        return jsonify({"error": "Title and date are legally required bindings"}), 400
        
    conn = get_db_connection()
    event = conn.execute("SELECT * FROM events WHERE id = ? AND created_by = ?", (event_id, teacher_id)).fetchone()
    if not event:
        conn.close()
        return jsonify({"error": "Event not found or unauthorized to edit"}), 404
        
    conn.execute("UPDATE events SET title = ?, description = ?, date = ? WHERE id = ?", (title, description, date_val, event_id))
    conn.commit()
    conn.close()
    
    return jsonify({"status": "success", "message": "Event updated successfully"})

@app.route("/api/events/<int:event_id>", methods=["DELETE"])
def delete_event(event_id):
    if session.get("role") != "Teacher":
        return jsonify({"error": "Unauthorized"}), 403
        
    teacher_id = session.get("user_id")
    
    conn = get_db_connection()
    event = conn.execute("SELECT * FROM events WHERE id = ? AND created_by = ?", (event_id, teacher_id)).fetchone()
    if not event:
        conn.close()
        return jsonify({"error": "Event not found or unauthorized to delete"}), 404
        
    conn.execute("DELETE FROM events WHERE id = ?", (event_id,))
    conn.commit()
    conn.close()
    
    return jsonify({"status": "success", "message": "Event deleted successfully"})

# ---------------- NOTIFICATIONS API ----------------
@app.route("/api/notifications", methods=["GET"])
def get_notifications():
    if "user_id" not in session:
        return jsonify({"error": "Unauthorized"}), 403
        
    user_id = session["user_id"]
    conn = get_db_connection()
    notifs = conn.execute("SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC", (user_id,)).fetchall()
    conn.close()
    
    result = []
    for n in notifs:
        result.append({
            "id": n["id"],
            "message": n["message"],
            "type": n["type"],
            "is_read": bool(n["is_read"]),
            "created_at": str(n["created_at"])
        })
        
    return jsonify({"status": "success", "notifications": result})

@app.route("/api/notifications/read", methods=["POST"])
def mark_notifications_read():
    if "user_id" not in session:
        return jsonify({"error": "Unauthorized"}), 403
        
    user_id = session["user_id"]
    conn = get_db_connection()
    conn.execute("UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0", (user_id,))
    conn.commit()
    conn.close()
    
    return jsonify({"status": "success"})

if __name__ == "__main__":
    # threaded=False explicitly prevents underlying C++ PaddleML OpenMP Threading conflicts crashing the runtime silently natively seamlessly
        app.run(debug=False, threaded=False, use_reloader=False)