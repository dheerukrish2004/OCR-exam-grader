import os
from dotenv import load_dotenv
from google import genai

load_dotenv()

client = genai.Client(api_key="GEMINI_API_KEY")

def clean_ocr_text(raw_text):

    prompt = f"""
You are correcting OCR extracted exam text.

CRITICAL RULES:
- Preserve question numbers exactly as written (1, 2, 3, etc.).
- Do NOT remove or merge question numbers.
- Keep each question starting on a new line.
- Fix spelling errors.
- Fix broken words.
- Improve sentence clarity.
- Do NOT add new content.
- Do NOT remove content.

Text:
{raw_text}
"""

    import time
    import re

    for attempt in range(3):
        try:
            response = client.models.generate_content(
                model="gemini-3.5-flash",
                contents=prompt,
            )
            return response.text.strip()

        except Exception as e:
            err_str = str(e)
            if "429" in err_str or "RESOURCE_EXHAUSTED" in err_str:
                match = re.search(r'retry in ([\d\.]+)s', err_str)
                wait_time = float(match.group(1)) + 1 if match else 20
                print(f"[text_cleaner] Rate limit hit. Waiting {wait_time:.1f} seconds (Attempt {attempt+1}/3)...")
                time.sleep(wait_time)
            else:
                print("OCR CLEAN ERROR:", err_str)
                return raw_text
                
    return raw_text 