import fitz  # PyMuPDF
import os

def extract_text_from_teacher_pdf(pdf_path):
    doc = fitz.open(pdf_path)
    full_text = ""

    for page in doc:
        full_text += page.get_text()

    return full_text


def extract_images_from_student_pdf(pdf_path):
    doc = fitz.open(pdf_path)
    image_paths = []

    for i, page in enumerate(doc):

        # Render page to high resolution image (300 DPI equivalent)
        zoom = 2  # 2 = ~300 DPI
        mat = fitz.Matrix(zoom, zoom)
        pix = page.get_pixmap(matrix=mat)

        img_path = f"page_{i}.png"
        pix.save(img_path)

        image_paths.append(img_path)

    return image_paths