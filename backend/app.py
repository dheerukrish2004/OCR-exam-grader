from flask import Flask, request, jsonify
from flask_cors import CORS
from ocr import extract_text
from semantic import semantic_score
from rake_nltk import Rake
import nltk

app = Flask(__name__)
CORS(app)

nltk.download("stopwords", quiet=True)

DATA = {
    "student_text": None,
    "answer_key": None
}

def extract_keywords(text, top_n=5):
    rake = Rake()
    rake.extract_keywords_from_text(text)
    phrases = rake.get_ranked_phrases()
    return phrases[:top_n]

def generate_feedback(missing):
    if not missing:
        return (
            "The answer demonstrates a strong understanding of the topic with "
            "clear explanations and appropriate use of concepts."
        )

    return (
        "The answer is partially correct. It requires a clearer explanation of "
        + ", ".join(missing)
        + ", particularly how these concepts relate to the topic."
    )

@app.route("/reset", methods=["POST"])
def reset():
    DATA["student_text"] = None
    DATA["answer_key"] = None
    return jsonify({"status": "reset"})

@app.route("/upload-student", methods=["POST"])
def upload_student():
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    image = request.files["file"]
    image.save("temp.png")

    student_text = extract_text("temp.png")

    if not student_text.strip():
        return jsonify({"error": "OCR failed"}), 400

    DATA["student_text"] = student_text
    return jsonify({"status": "student_uploaded"})

@app.route("/upload-key", methods=["POST"])
def upload_key():
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    DATA["answer_key"] = request.files["file"].read().decode("utf-8")
    return jsonify({"status": "key_uploaded"})

@app.route("/evaluate", methods=["GET"])
def evaluate():
    if not DATA["student_text"] or not DATA["answer_key"]:
        return jsonify({
            "ready": False,
            "message": "Please upload student answer and answer key first"
        })

    score = semantic_score(
        DATA["student_text"],
        DATA["answer_key"]
    )
    score = round(float(score), 2)

    key_concepts = extract_keywords(DATA["answer_key"], top_n=5)
    student_concepts = extract_keywords(DATA["student_text"], top_n=5)

    missing = [
        c for c in key_concepts
        if c not in student_concepts
    ]

    if score >= 75:
        feedback = (
            "The answer demonstrates a strong understanding of the topic with "
            "clear explanations and appropriate concepts."
        )
        improvements = []
    else:
        feedback = generate_feedback(missing)
        improvements = missing

    return jsonify({
        "ready": True,
        "score": score,
        "feedback": feedback,
        "improvements": improvements
    })

if __name__ == "__main__":
    app.run(debug=True)
