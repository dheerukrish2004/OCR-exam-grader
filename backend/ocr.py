import sys
import types

# In-memory compatibility shim for PaddleX expecting legacy LangChain modules
if "langchain.docstore.document" not in sys.modules:
    try:
        from langchain_core.documents import Document
        if "langchain.docstore" not in sys.modules:
            docstore_mod = types.ModuleType("langchain.docstore")
            sys.modules["langchain.docstore"] = docstore_mod
        else:
            docstore_mod = sys.modules["langchain.docstore"]

        doc_mod = types.ModuleType("langchain.docstore.document")
        doc_mod.Document = Document
        docstore_mod.document = doc_mod
        sys.modules["langchain.docstore.document"] = doc_mod
    except ImportError:
        pass

if "langchain.text_splitter" not in sys.modules:
    try:
        import langchain_text_splitters
        sys.modules["langchain.text_splitter"] = langchain_text_splitters
    except ImportError:
        pass

from paddleocr import PaddleOCR
import cv2

import os

ocr = PaddleOCR(lang="en")

def extract_text(image_path):
    img = cv2.imread(image_path)

    if img is None:
        return ""

    h, w = img.shape[:2]
    max_dim = max(h, w)

    target_path = image_path
    temp_scaled_path = None
    cur_w, cur_h = w, h

    if max_dim > 1000:
        scale = 1000.0 / max_dim
        cur_w = int(w * scale)
        cur_h = int(h * scale)
        scaled_img = cv2.resize(
            img,
            (cur_w, cur_h),
            interpolation=cv2.INTER_AREA
        )
        temp_scaled_path = f"temp_scaled_{os.path.basename(image_path)}"
        cv2.imwrite(temp_scaled_path, scaled_img)
        target_path = temp_scaled_path

    result = None
    try:
        try:
            res_iter = ocr.predict(target_path)
            result = list(res_iter) if not isinstance(res_iter, list) else res_iter
        except Exception:
            if temp_scaled_path and os.path.exists(temp_scaled_path):
                try:
                    os.remove(temp_scaled_path)
                except Exception:
                    pass

            scale_800 = 800.0 / max_dim
            r_w = int(w * scale_800)
            r_h = int(h * scale_800)
            scaled_800 = cv2.resize(
                img,
                (r_w, r_h),
                interpolation=cv2.INTER_AREA
            )
            temp_scaled_path = f"temp_scaled_800_{os.path.basename(image_path)}"
            cv2.imwrite(temp_scaled_path, scaled_800)
            target_path = temp_scaled_path
            res_iter = ocr.predict(target_path)
            result = list(res_iter) if not isinstance(res_iter, list) else res_iter
    finally:
        if temp_scaled_path and os.path.exists(temp_scaled_path):
            try:
                os.remove(temp_scaled_path)
            except Exception:
                pass

    if not result or not result[0].get("rec_texts"):
        return ""

    text = "\n".join(result[0]["rec_texts"])
    return text