from sklearn.feature_extraction.text import TfidfVectorizer
from semantic import semantic_score


def extract_concepts(answer_key, top_n=5):
    """
    Automatically extract important concepts
    from the answer key using TF-IDF
    """
    vectorizer = TfidfVectorizer(
        stop_words="english",
        ngram_range=(1, 2)
    )

    tfidf = vectorizer.fit_transform([answer_key])
    scores = tfidf.toarray()[0]
    features = vectorizer.get_feature_names_out()

    ranked = sorted(
        zip(features, scores),
        key=lambda x: x[1],
        reverse=True
    )

    concepts = [term for term, score in ranked[:top_n]]
    return concepts


def generate_feedback(answer_key, student_text):
    concepts = extract_concepts(answer_key)

    strengths = []
    improvements = []

    for concept in concepts:
        sim = semantic_score(concept, student_text)

        if sim >= 65:
            strengths.append(concept)
        else:
            improvements.append(concept)

    # Rule-based feedback text
    if not improvements:
        feedback = "The answer covers all key concepts clearly and accurately."
    elif len(strengths) > len(improvements):
        feedback = (
            "The answer demonstrates good understanding, "
            "but more clarity is needed on: " + ", ".join(improvements)
        )
    else:
        feedback = (
            "The answer is partially correct. "
            "Focus more on: " + ", ".join(improvements)
        )

    return strengths, improvements, feedback
