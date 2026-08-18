import os
import glob

history_dir = r"C:\Users\sicph\AppData\Roaming\Code\User\History"
project_dir = r"k:\MAIN PROJECT\ocr-exam-grader\frontend\src\components"

components = [
    "Upload", "Signup", "OCR", "Login", "Result", 
    "Landing", "KeyUpload", "CalendarWidget"
]

for comp in components:
    print(f"Recovering {comp}...")
    history_files = glob.glob(os.path.join(history_dir, '**', '*.jsx'), recursive=True)
    
    candidates = []
    # Sometimes it could be `function xxx` instead of export default function
    signature = f"function {comp}"
    for f in history_files:
        try:
            sz = os.path.getsize(f)
            if sz == 0: continue
            with open(f, 'r', encoding='utf-8', errors='ignore') as file:
                content = file.read()
                if signature in content:
                    candidates.append((f, os.path.getmtime(f), content))
        except Exception as e:
            pass
            
    if candidates:
        candidates.sort(key=lambda x: x[1], reverse=True)
        best_content = candidates[0][2]
        
        # Apply the API URL fix directly
        best_content = best_content.replace('http://localhost:5000', 'http://127.0.0.1:5000')
        
        out_path = os.path.join(project_dir, f"{comp}.jsx")
        with open(out_path, 'w', encoding='utf-8') as out:
            out.write(best_content)
        print(f"Successfully recovered {comp}.jsx from {candidates[0][0]} ({len(best_content)} bytes)")
    else:
        print(f"FAILED to find {comp} in history!")
