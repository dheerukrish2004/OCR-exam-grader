
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

model = SentenceTransformer("all-MiniLM-L6-v2")

def semantic_score(student_text, answer_key_text):
    if not student_text.strip() or not answer_key_text.strip():
        return 0.0

    # --- Whole paragraph similarity ---
    embeddings = model.encode([student_text, answer_key_text])
    overall_sim = cosine_similarity(
        [embeddings[0]],
        [embeddings[1]]
    )[0][0]

    # --- Sentence coverage similarity ---
    student_sentences = [s.strip() for s in student_text.split(".") if len(s.strip()) > 5]
    key_sentences = [s.strip() for s in answer_key_text.split(".") if len(s.strip()) > 5]

    if student_sentences and key_sentences:
        student_emb = model.encode(student_sentences)
        key_emb = model.encode(key_sentences)

        sim_matrix = cosine_similarity(student_emb, key_emb)
        max_per_key = sim_matrix.max(axis=0)
        coverage_sim = np.mean(max_per_key)
    else:
        coverage_sim = overall_sim

    # --- Blend them (balanced weighting) ---
    final_score = (0.75 * overall_sim) + (0.25 * coverage_sim)
    return round(float(final_score * 100), 2)