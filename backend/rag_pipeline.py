

from langchain_huggingface import HuggingFaceEmbeddings
from langchain_chroma import Chroma

from rag_config import (
    EMBEDDING_MODEL_NAME,
    CHROMA_PERSIST_DIR,
    CHROMA_COLLECTION_NAME,
    TOP_K,
    get_embeddings,
)

_vectorstore = None
_get_embeddings = get_embeddings


def _get_vectorstore():
    global _vectorstore
    if _vectorstore is None:
        _vectorstore = Chroma(
            collection_name=CHROMA_COLLECTION_NAME,
            embedding_function=_get_embeddings(),
            persist_directory=CHROMA_PERSIST_DIR,
        )
    return _vectorstore


def _build_query(
    question_no: str,
    student_answer: str,
    question_text: str = None,
) -> str:

    parts = []

    if question_text and question_text.strip():
        parts.append("Question: %s" % question_text.strip())
    else:
        parts.append("Question %s." % question_no)

    if student_answer and student_answer.strip() and student_answer.strip() != "No answer provided":
        parts.append("Student answer: %s" % student_answer.strip())

    return " ".join(parts)


def retrieve_context_for_evaluation(
    student_answers: dict,
    subject: str = None,
    question_texts: dict = None,
    top_k: int = None,
) -> dict:
  
    k = top_k if top_k is not None else TOP_K
    vectorstore = _get_vectorstore()

    collection = vectorstore._collection
    if collection.count() == 0:
        return {}

    if question_texts is None:
        question_texts = {}

    result = {}

    for q_no, student_answer in student_answers.items():
        q_id = str(q_no)

        query = _build_query(
            question_no=q_id,
            student_answer=student_answer,
            question_text=question_texts.get(q_no) or question_texts.get(q_id),
        )

        where_filter = None
        if subject:
            where_filter = {"subject": subject}

        try:
            docs_with_scores = vectorstore.similarity_search_with_score(
                query=query,
                k=k,
                filter=where_filter,
            )

            retrieved = []
            for doc, score in docs_with_scores:
                retrieved.append({
                    "content": doc.page_content,
                    "metadata": doc.metadata,
                    "similarity_score": round(float(score), 4),
                })

            result[q_id] = retrieved

        except Exception as e:
            result[q_id] = []

    return result
