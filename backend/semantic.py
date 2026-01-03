from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity

# Lightweight, fast, accurate
model = SentenceTransformer("all-MiniLM-L6-v2")

def semantic_score(student_text, answer_key_text):
    student_text = student_text.lower().strip()
    answer_key_text = answer_key_text.lower().strip()

    if not student_text or not answer_key_text:
        return 0.0

    embeddings = model.encode([student_text, answer_key_text])
    similarity = cosine_similarity(
        [embeddings[0]],
        [embeddings[1]]
    )[0][0]

    return round(similarity * 100, 2)
