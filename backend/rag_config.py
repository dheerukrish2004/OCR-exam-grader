import os
EMBEDDING_MODEL_NAME = "all-MiniLM-L6-v2"

CHROMA_PERSIST_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "vector_store")
CHROMA_COLLECTION_NAME = "reference_answers"

CHUNK_SIZE = 500       
CHUNK_OVERLAP = 50      

TOP_K = 3               

DOC_TYPE_REFERENCE = "reference"
DOC_TYPE_CONCEPT = "concept"
DOC_TYPE_RUBRIC = "rubric"

VALID_DOC_TYPES = {DOC_TYPE_REFERENCE, DOC_TYPE_CONCEPT, DOC_TYPE_RUBRIC}

_embeddings = None


def get_embeddings():
    global _embeddings
    if _embeddings is None:
        from langchain_huggingface import HuggingFaceEmbeddings
        _embeddings = HuggingFaceEmbeddings(
            model_name=EMBEDDING_MODEL_NAME,
            model_kwargs={"model_kwargs": {"use_safetensors": False}},
        )
    return _embeddings
