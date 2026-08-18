# OCR-exam-grader
Automated handwritten answer-sheet grading using OCR, semantic analysis, and Retrieval-Augmented Generation (RAG).

The system extracts handwritten answers from uploaded answer sheets using OCR, compares them with teacher-provided reference answers, and uses semantic analysis and RAG-based context retrieval to generate scores and feedback.

Features

- Handwritten answer sheet upload
- OCR-based text extraction
- Teacher answer key upload
- Question and answer parsing
- Semantic comparison between student and reference answers
- RAG-based retrieval using ChromaDB
- Gemini-based answer evaluation and feedback
- Student and teacher dashboards
- Exam result and score display
- Login and signup functionality

Technology Stack

Backend
- Python
- Flask
- PaddleOCR
- Google Gemini API
- ChromaDB
- Sentence Transformers
- SQLite

Frontend
- React
- Vite
- Tailwind CSS
- JavaScript

Project Structure

```text
OCR-exam-grader/
│
├── backend/
│   ├── app.py
│   ├── ocr.py
│   ├── semantic.py
│   ├── llm_feedback.py
│   ├── rag_config.py
│   ├── rag_ingest.py
│   ├── rag_pipeline.py
│   ├── test_rag.py
│   ├── pdf_parser.py
│   ├── pdf_utils.py
│   ├── question_parser.py
│   ├── text_cleaner.py
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   ├── package.json
│   └── package-lock.json
│
├── .gitignore
└── README.md
### RAG Implementation

- rag_ingest.py — Ingests reference answers, rubrics, and concept documents into ChromaDB.
- rag_pipeline.py — Retrieves relevant documents from ChromaDB based on the student answer.
- rag_config.py — Contains RAG configuration.
- llm_feedback.py — Sends the augmented evaluation prompt to Gemini and generates the score and feedback.
- test_rag.py — Demonstrates the complete RAG flow: Ingestion → Retrieval → Augmentation → Generation.
