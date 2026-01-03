from textblob import TextBlob

def spell_correct(text):
    if not text.strip():
        return text

    blob = TextBlob(text)
    corrected = blob.correct()

    return str(corrected)
