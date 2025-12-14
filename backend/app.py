from flask import Flask, request, jsonify
from flask_cors import CORS
from paddleocr import PaddleOCR
from difflib import SequenceMatcher

app = Flask(__name__)
CORS(app)

ocr = PaddleOCR(lang="en")

# in-memory storage
student_text = ""
answer_key_text = ""

@app.route("/reset", methods=["POST"])
def reset():
    global student_text, answer_key_text
    student_text = ""
    answer_key_text = ""
    return jsonify({"status": "reset"})

@app.route("/upload-student", methods=["POST"])
def upload_student():
    global student_text
    file = request.files["file"]
    file.save("student.png")

    result = ocr.predict("student.png")
    student_text = " ".join(result[0]["rec_texts"])

    return jsonify({"status": "student_uploaded"})

@app.route("/upload-key", methods=["POST"])
def upload_key():
    global answer_key_text
    file = request.files["file"]
    answer_key_text = file.read().decode("utf-8")

    return jsonify({"status": "key_uploaded"})

@app.route("/evaluate", methods=["GET"])
def evaluate():
    # 🔒 CRITICAL FIX — block empty comparison
    if not student_text.strip() or not answer_key_text.strip():
        return jsonify({
            "ready": False,
            "score": None
        })

    similarity = SequenceMatcher(
        None,
        student_text.lower(),
        answer_key_text.lower()
    ).ratio()

    return jsonify({
        "ready": True,
        "score": round(similarity * 100, 2)
    })

if __name__ == "__main__":
    app.run(debug=True)
