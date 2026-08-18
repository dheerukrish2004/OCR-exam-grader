import os
from dotenv import load_dotenv
from google import genai
load_dotenv()


client = genai.Client(api_key="GEMINI_API_KEY")

def generate_evaluation(student_answers, teacher_answers, question_marks, rag_context=None):

    prompt = """
You are an expert university examiner. Let's evaluate these student answers based solely on the reference key.
Return the result STRICTLY as a JSON object exactly adhering to the format below.

{
  "total_score": <number>,
  "answers": [
    {
      "question": "1",
      "score": <number out of max_marks>,
      "feedback": "<short constructive feedback highlighting correct components and missing concepts>"
    }
  ]
}

Do NOT output markdown blocks or any other text outside the JSON. Just the raw JSON dictionary.
"""

    for q_no in teacher_answers:
        prompt += f"\n\nQUESTION {q_no} (Max Marks: {question_marks.get(q_no, 0)})\n"
        prompt += f"REFERENCE:\n{teacher_answers[q_no]}\n"
        prompt += f"STUDENT:\n{student_answers.get(q_no, 'No answer provided.')}\n"

        q_rag_docs = []
        if rag_context and isinstance(rag_context, dict):
            q_rag_docs = rag_context.get(str(q_no)) or rag_context.get(q_no) or []

        has_rag = bool(q_rag_docs)

        if has_rag:
            prompt += "\nRETRIEVED KNOWLEDGE FROM RAG:\n"
            for doc in q_rag_docs:
                if isinstance(doc, dict):
                    content = doc.get("content", "").strip()
                    meta = doc.get("metadata", {})
                    doc_type = meta.get("type", "REFERENCE").upper() if isinstance(meta, dict) else "REFERENCE"
                else:
                    content = str(doc).strip()
                    doc_type = "REFERENCE"
                if content:
                    prompt += f"[{doc_type}]\n{content}\n\n"
            prompt += "Use the retrieved RAG knowledge as supporting context when evaluating the student answer. Do not blindly copy retrieved content. The original teacher reference answer remains the primary exam reference.\n"

    import time
    import re
    import json

    for attempt in range(3):
        try:
            response = client.models.generate_content(
                model="gemini-3.5-flash",
                contents=prompt,
            )
            text = response.text.strip()
            if text.startswith("```json"):
                text = text.replace("```json", "", 1)
            if text.endswith("```"):
                text = text[:-3]
                
            return json.loads(text.strip())

        except Exception as e:
            err_str = str(e)
            if "429" in err_str or "RESOURCE_EXHAUSTED" in err_str:
                match = re.search(r'retry in ([\d\.]+)s', err_str)
                wait_time = float(match.group(1)) + 1 if match else 20
                print(f"[llm_feedback] Rate limit hit. Waiting {wait_time:.1f} seconds (Attempt {attempt+1}/3)...")
                time.sleep(wait_time)
            elif "Expecting value" in err_str:
                print("JSON PARSE ERROR, RETRYING...")
                time.sleep(2)
            else:
                print("GEMINI ERROR:", err_str)
                return None
                
    return None