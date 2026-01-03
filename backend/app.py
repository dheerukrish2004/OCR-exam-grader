from flask import Flask, request, jsonify
from flask_cors import CORS
from ocr import extract_text
from semantic import semantic_score
from spell_correct import spell_correct

app = Flask(__name__)
CORS(app)

# simple in-memory storage
DATA = {
    "student_text": None,
    "answer_key": None
}

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

    # OCR
    student_text = extract_text("temp.png")

    # spell correction (optional)
    student_text = spell_correct(student_text)

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

    score = round(
    semantic_score(DATA["student_text"], DATA["answer_key"]),
    2
)

    

    return jsonify({
        "ready": True,
        "score":round(score),          
        "student_text": DATA["student_text"]
    })


if __name__ == "__main__":
    app.run(debug=True)
