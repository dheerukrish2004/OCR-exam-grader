from flask import Flask, request, jsonify
from flask_cors import CORS
from ocr import extract_text
from semantic import semantic_score
from llm_feedback import generate_llm_feedback
import threading

app = Flask(__name__)
CORS(app)

# ------------------------------
# In-memory state
# ------------------------------
DATA = {
    "student_text": None,
    "answer_key": None,
    "score": None,
    "feedback": None,
    "feedback_ready": False,
    "feedback_started": False
}

# ------------------------------
# RESET
# ------------------------------
@app.route("/reset", methods=["POST"])
def reset():
    DATA.update({
        "student_text": None,
        "answer_key": None,
        "score": None,
        "feedback": None,
        "feedback_ready": False,
        "feedback_started": False
    })
    return jsonify({"status": "reset"})

# ------------------------------
# UPLOAD STUDENT ANSWER
# ------------------------------
@app.route("/upload-student", methods=["POST"])
def upload_student():
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files["file"]
    file.save("temp.png")

    text = extract_text("temp.png")
    if not text.strip():
        return jsonify({"error": "OCR failed"}), 400

    DATA["student_text"] = text
    return jsonify({"status": "student_uploaded"})

# ------------------------------
# UPLOAD ANSWER KEY
# ------------------------------
@app.route("/upload-key", methods=["POST"])
def upload_key():
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    DATA["answer_key"] = request.files["file"].read().decode("utf-8")
    return jsonify({"status": "key_uploaded"})

# ------------------------------
# BACKGROUND FEEDBACK WORKER
# ------------------------------
def feedback_worker(student_text, answer_key, score):
    try:
        # 🟢 High score → minimal feedback
        if score >= 90:
            feedback = (
                "The response demonstrates strong conceptual understanding and clarity. "
                "Only minor refinements in explanation depth could further strengthen the answer."
            )

        # 🟡 Medium score → balanced feedback
        elif score >= 75:
            feedback = generate_llm_feedback(
                student_text,
                answer_key,
                score
            )

        # 🔴 Low score → corrective feedback
        else:
            feedback = generate_llm_feedback(
                student_text,
                answer_key,
                score
            )

        # SAFETY CHECK
        if not isinstance(feedback, str) or not feedback.strip():
            feedback = (
                "The response lacks sufficient conceptual clarity and depth. "
                "Several expected explanations are missing or weakly developed."
            )

    except Exception:
        feedback = (
            "The answer requires clearer explanation and stronger conceptual structure. "
            "Important ideas are either missing or insufficiently developed."
        )

    DATA["feedback"] = feedback
    DATA["feedback_ready"] = True

# ------------------------------
# EVALUATE (FAST SCORE)
# ------------------------------
@app.route("/evaluate", methods=["GET"])
def evaluate():
    if not DATA["student_text"] or not DATA["answer_key"]:
        return jsonify({
            "ready": False,
            "message": "Please upload student answer and answer key first"
        })

    # Reset feedback state
    DATA["feedback"] = None
    DATA["feedback_ready"] = False
    DATA["feedback_started"] = False

    # Semantic score
    score = semantic_score(
        DATA["student_text"],
        DATA["answer_key"]
    )
    score = round(float(score), 2)
    DATA["score"] = score

    # Start feedback generation once
    if not DATA["feedback_started"]:
        DATA["feedback_started"] = True
        threading.Thread(
            target=feedback_worker,
            args=(DATA["student_text"], DATA["answer_key"], score),
            daemon=True
        ).start()

    return jsonify({
        "ready": True,
        "score": score
    })

# ------------------------------
# FETCH FEEDBACK (POLLING)
# ------------------------------
@app.route("/get-feedback", methods=["GET"])
def get_feedback():
    if DATA["feedback_ready"]:
        return jsonify({
            "ready": True,
            "feedback": DATA["feedback"]
        })

    return jsonify({"ready": False})

# ------------------------------
if __name__ == "__main__":
    app.run(debug=True)
