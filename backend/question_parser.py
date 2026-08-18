import re
from semantic import semantic_score

def split_by_questions(text, teacher_answers=None):
    if not text:
        return {}, {}

    text = text.replace("\r", "\n")
    lines = text.split("\n")
    
    blocks = []
    current_label = None
    current_lines = []
    marks_map = {}

    for line in lines:
        line_clean = line.strip()
        if not line_clean:
            continue
            
        m = re.match(r'^(?:(Q|Question|Ans|Answer)\s*[\.\:\-\)]?\s*(\d+)[\.\:\-\)]*|(\d+)[\.\:\-\)]+)\s*(.*)$', line_clean, re.IGNORECASE)
        if m:
            marker = m.group(1)
            num = m.group(2) or m.group(3)
            rest = m.group(4).strip()
            
            if current_label is not None:
                blocks.append((current_label, "\n".join(current_lines).strip()))
            current_label = num
            current_lines = [rest] if rest else []
        else:
            if current_label is not None:
                current_lines.append(line_clean)

    if current_label is not None:
        blocks.append((current_label, "\n".join(current_lines).strip()))

    qa_map = {}
    if not blocks:
        raw_chunks = [c.strip() for c in re.split(r'\n\s*\n', text) if len(c.strip()) > 5]
        blocks = [(str(i+1), c) for i, c in enumerate(raw_chunks)]

    if teacher_answers is None:
        for lbl, txt in blocks:
            mark_m = re.search(r'\((\d+)\)', txt)
            if mark_m:
                marks_map[lbl] = int(mark_m.group(1))
                txt = re.sub(r'\(\d+\)', '', txt).strip()
            qa_map[lbl] = txt
        return qa_map, marks_map

    t_keys = sorted(teacher_answers.keys(), key=lambda x: int(x) if str(x).isdigit() else str(x))
    
    # If the number of extracted blocks matches teacher questions exactly
    if len(blocks) == len(t_keys):
        for t_q, (lbl, txt) in zip(t_keys, blocks):
            qa_map[t_q] = txt
    else:
        # Semantic mapping: allocate each block to its single best matching teacher question
        allocations = {t_q: [] for t_q in t_keys}
        for lbl, txt in blocks:
            best_q = None
            best_score = -1
            for t_q in t_keys:
                score = semantic_score(txt, teacher_answers[t_q])
                if score > best_score:
                    best_score = score
                    best_q = t_q
            if best_q is not None and best_score >= 4.0:
                allocations[best_q].append(txt)

        for t_q in t_keys:
            if allocations[t_q]:
                qa_map[t_q] = "\n".join(allocations[t_q])
            else:
                qa_map[t_q] = "No answer provided"

    return qa_map, marks_map