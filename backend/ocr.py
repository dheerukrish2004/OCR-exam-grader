from paddleocr import PaddleOCR
import cv2

ocr = PaddleOCR(lang="en")

def extract_text(image_path):
    img = cv2.imread(image_path)

    if img is None:
        return ""

    result = ocr.predict(image_path)

    if not result or not result[0]["rec_texts"]:
        return ""

    text = " ".join(result[0]["rec_texts"])
    return text
