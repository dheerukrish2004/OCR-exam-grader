import subprocess
import re

# Fallback feedback (guaranteed safe)
def default_feedback():
    return (
        "1. Lacks sufficient explanation of key technical concepts.\n"
        "2. Needs clearer discussion of underlying mechanisms.\n"
        "3. Requires stronger linkage between theory and application."
    )

def generate_llm_feedback(student_text, answer_key, score):
    prompt = f"""
You are an academic examiner.

STRICT RULES:
- DO NOT comment on grammar, spelling, casing, or sentence structure
- Focus ONLY on missing or weak technical concepts
- Third-person academic tone only
- Maximum 3 numbered points
- One short sentence per point

REFERENCE ANSWER:
{answer_key}

STUDENT ANSWER (context only):
{student_text}

TASK:
Identify conceptual gaps compared to the reference answer.

OUTPUT FORMAT (exact):
1. <conceptual gap>
2. <conceptual gap>
3. <conceptual gap>
"""

    try:
        result = subprocess.run(
            ["ollama", "run", "phi3:mini"],
            input=prompt,
            text=True,
            capture_output=True,
            encoding="utf-8",
            timeout=120
        )

        raw = result.stdout.strip()
        if not raw:
            return default_feedback()

        # ---- CLEAN ENCODING NOISE ----
        raw = raw.replace("â€”", "-").replace("’", "'")

        # ---- SPLIT INTO SENTENCES ----
        sentences = re.split(r"\.\s+", raw)
        sentences = [s.strip() for s in sentences if len(s.strip()) > 20]
        sentences = sentences[:3]

        if not sentences:
            return default_feedback()

        formatted = "\n".join(
            f"{i+1}. {sentences[i].rstrip('.')}"
            for i in range(len(sentences))
        )

        # ---- HARD BLOCK LANGUAGE-BASED FEEDBACK ----
        banned_terms = [
            "grammar", "spelling", "capital", "uppercase", "lowercase",
            "sentence", "punctuation", "misspelled", "casing"
        ]

        if any(term in formatted.lower() for term in banned_terms):
            return default_feedback()

        return formatted

    except Exception:
        return default_feedback()
