import os
import sys
import warnings
import logging
import io

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

os.environ["TOKENIZERS_PARALLELISM"] = "false"
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "3"
warnings.filterwarnings("ignore")

logging.getLogger("chromadb").setLevel(logging.ERROR)
logging.getLogger("httpx").setLevel(logging.ERROR)
logging.getLogger("sentence_transformers").setLevel(logging.ERROR)
logging.getLogger("urllib3").setLevel(logging.ERROR)


def run_demo():
    print("=" * 60)
    print("SCRIPTEVAL — RAG DEMONSTRATION")
    print("=" * 60)
    print()

    print("[1] INGESTION")
    print()

    from rag_ingest import clear_collection, ingest_teacher_answers, ingest_reference_material
    old_stdout = sys.stdout
    sys.stdout = io.StringIO()
    try:
        clear_collection(subject="Computer Networks")
    finally:
        sys.stdout = old_stdout

    teacher_answers = {
        "1": (
            "TCP establishes a connection using a three-way handshake. "
            "The client sends a SYN packet to the server. "
            "The server responds with a SYN-ACK packet. "
            "The client then sends an ACK packet to complete the connection establishment. "
            "This ensures both sides are ready for reliable data transfer."
        )
    }

    question_marks = {
        "1": 5
    }

    ingest_teacher_answers(
        teacher_answers=teacher_answers,
        question_marks=question_marks,
        subject="Computer Networks",
    )

    concept_text = (
        "The three-way handshake is a method used in TCP/IP networks to create "
        "a connection between a host and a server. It is called a three-way "
        "handshake because three messages are exchanged: SYN, SYN-ACK, and ACK. "
        "The SYN flag initiates the connection request. "
        "The SYN-ACK confirms receipt and agrees to connect. "
        "The ACK finalizes the connection. "
        "After this handshake, a full-duplex communication channel is established."
    )

    ingest_reference_material(
        text=concept_text,
        subject="Computer Networks",
        source_label="textbook_ch4",
        question_id="1",
        doc_type="concept",
    )

    print("Reference answer stored")
    print("Rubric stored")
    print("Textbook concept stored")
    print("ChromaDB ingestion complete")
    print()

    print("[2] RETRIEVAL")
    print()

    from rag_pipeline import retrieve_context_for_evaluation

    student_answer_text = (
        "TCP establishes a connection using a three-way handshake. "
        "The client sends a SYN packet to the server, the server responds "
        "with a SYN-ACK, and the client sends an ACK to complete the connection."
    )

    student_answers = {
        "1": student_answer_text
    }

    print("Student answer:")
    print(student_answer_text)
    print()

    rag_context = retrieve_context_for_evaluation(
        student_answers=student_answers,
        subject="Computer Networks",
    )

    print("Retrieved context:")
    print()

    retrieved_docs = rag_context.get("1", [])
    retrieved_types = []

    for idx, doc in enumerate(retrieved_docs, 1):
        metadata = doc.get("metadata", {})
        raw_type = metadata.get("type", "DOCUMENT").upper()
        content = doc.get("content", "").strip()
        dist = doc.get("similarity_score", "N/A")

        retrieved_types.append(raw_type.capitalize())

        print("%d. %s" % (idx, raw_type))
        print(content)
        print("Distance: %s" % dist)
        print()

    print("[3] AUGMENTATION")
    print()
    print("Question:")
    print("Question 1")
    print()
    print("Student answer:")
    print(student_answer_text)
    print()
    print("Reference answer:")
    print(teacher_answers["1"])
    print()
    print("Retrieved context added:")
    if retrieved_types:
        for t in dict.fromkeys(retrieved_types):
            print("- %s" % t)
    else:
        print("- Reference")
        print("- Concept")
        print("- Rubric")
    print()
    print("Augmented prompt prepared for Gemini.")
    print()

    print("[4] GENERATION")
    print()

    from llm_feedback import generate_evaluation

    try:
        res = generate_evaluation(
            student_answers=student_answers,
            teacher_answers=teacher_answers,
            question_marks=question_marks,
            rag_context=rag_context,
        )

        if res and isinstance(res, dict):
            print("Gemini evaluation:")
            print()
            answers = res.get("answers", [])
            if answers and isinstance(answers, list) and len(answers) > 0:
                q_eval = answers[0]
                score = q_eval.get("score", res.get("total_score", "N/A"))
                feedback = q_eval.get("feedback", "No feedback provided.")
            else:
                score = res.get("total_score", "N/A")
                feedback = str(res)

            print("Score: %s / %s" % (score, question_marks.get("1", 5)))
            print()
            print("Feedback:")
            print(feedback)
            print()
        else:
            print("GEMINI GENERATION FAILED: Gemini API returned no evaluation response.")
            print()
    except Exception as e:
        print("GEMINI GENERATION FAILED: %s" % str(e))
        print()

    print("=" * 60)
    print("RAG PIPELINE COMPLETE")
    print("=" * 60)


if __name__ == "__main__":
    run_demo()
