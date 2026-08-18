import hashlib
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_chroma import Chroma
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document

from rag_config import (
    EMBEDDING_MODEL_NAME,
    CHROMA_PERSIST_DIR,
    CHROMA_COLLECTION_NAME,
    CHUNK_SIZE,
    CHUNK_OVERLAP,
    DOC_TYPE_REFERENCE,
    DOC_TYPE_CONCEPT,
    DOC_TYPE_RUBRIC,
    VALID_DOC_TYPES,
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


def _deterministic_id(subject: str, question_id: str, doc_type: str, chunk_index: int = 0) -> str:
    raw = f"{subject}||{question_id}||{doc_type}||{chunk_index}"
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()[:16]


def _chunk_text(text: str) -> list[str]:
    if not text or not text.strip():
        return []
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=CHUNK_SIZE,
        chunk_overlap=CHUNK_OVERLAP,
        separators=["\n\n", "\n", ". ", " ", ""],
    )
    return splitter.split_text(text.strip())


def _delete_existing_docs(vectorstore, subject: str, question_id: str, doc_type: str):
    try:
        collection = vectorstore._collection
        existing = collection.get(
            where={
                "$and": [
                    {"subject": subject},
                    {"question_id": str(question_id)},
                    {"type": doc_type},
                ]
            }
        )
        if existing and existing["ids"]:
            collection.delete(ids=existing["ids"])
    except Exception:
       
        pass



def ingest_teacher_answers(
    teacher_answers: dict,
    question_marks: dict = None,
    subject: str = "general",
) -> int:
   
    vectorstore = _get_vectorstore()
    total_stored = 0

    if question_marks is None:
        question_marks = {}

    for q_no, answer_text in teacher_answers.items():
        q_id = str(q_no)

        
        _delete_existing_docs(vectorstore, subject, q_id, DOC_TYPE_REFERENCE)

        chunks = _chunk_text(answer_text)
        if chunks:
            docs = []
            ids = []
            for i, chunk in enumerate(chunks):
                doc = Document(
                    page_content=chunk,
                    metadata={
                        "question_id": q_id,
                        "subject": subject,
                        "type": DOC_TYPE_REFERENCE,
                        "source": "answer_key",
                        "chunk_index": i,
                    },
                )
                docs.append(doc)
                ids.append(_deterministic_id(subject, q_id, DOC_TYPE_REFERENCE, i))

            vectorstore.add_documents(documents=docs, ids=ids)
            total_stored += len(docs)

        
        marks = question_marks.get(q_no) or question_marks.get(q_id)
        if marks is not None:
            _delete_existing_docs(vectorstore, subject, q_id, DOC_TYPE_RUBRIC)

            rubric_text = "Question %s: Maximum marks = %s." % (q_id, marks)
            rubric_doc = Document(
                page_content=rubric_text,
                metadata={
                    "question_id": q_id,
                    "subject": subject,
                    "type": DOC_TYPE_RUBRIC,
                    "source": "answer_key",
                    "chunk_index": 0,
                },
            )
            rubric_id = _deterministic_id(subject, q_id, DOC_TYPE_RUBRIC, 0)
            vectorstore.add_documents(documents=[rubric_doc], ids=[rubric_id])
            total_stored += 1

    return total_stored


def ingest_reference_material(
    text: str,
    subject: str,
    source_label: str = "reference_material",
    question_id: str = "general",
    doc_type: str = DOC_TYPE_CONCEPT,
) -> int:
    
    if doc_type not in VALID_DOC_TYPES:
        raise ValueError("doc_type must be one of: %s" % VALID_DOC_TYPES)

    vectorstore = _get_vectorstore()
    _delete_existing_docs(vectorstore, subject, question_id, doc_type)

    chunks = _chunk_text(text)
    if not chunks:
        return 0

    docs = []
    ids = []
    for i, chunk in enumerate(chunks):
        doc = Document(
            page_content=chunk,
            metadata={
                "question_id": str(question_id),
                "subject": subject,
                "type": doc_type,
                "source": source_label,
                "chunk_index": i,
            },
        )
        docs.append(doc)
        ids.append(_deterministic_id(subject, question_id, doc_type, i))

    vectorstore.add_documents(documents=docs, ids=ids)
    return len(docs)


def clear_collection(subject: str = None):
    
    vectorstore = _get_vectorstore()
    collection = vectorstore._collection

    if subject is not None:
        existing = collection.get(where={"subject": subject})
        if existing and existing["ids"]:
            collection.delete(ids=existing["ids"])
            print("[RAG] Cleared %d documents for subject: %s" % (len(existing["ids"]), subject))
        else:
            print("[RAG] No documents found for subject: %s" % subject)
    else:
        all_docs = collection.get()
        if all_docs and all_docs["ids"]:
            collection.delete(ids=all_docs["ids"])
            print("[RAG] Cleared all %d documents from collection." % len(all_docs["ids"]))
        else:
            print("[RAG] Collection is already empty.")


def get_collection_stats() -> dict:
    vectorstore = _get_vectorstore()
    collection = vectorstore._collection
    count = collection.count()
    return {
        "collection_name": CHROMA_COLLECTION_NAME,
        "persist_directory": CHROMA_PERSIST_DIR,
        "total_documents": count,
    }
