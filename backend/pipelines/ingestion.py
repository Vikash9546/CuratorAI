import logging
import os
import fitz
import groq
import base64
from pipelines.db import get_chroma_client, ensure_collection, load_model

CHUNK_SIZE = 500
CHUNK_OVERLAP = 50

def chunk_text(text, size=CHUNK_SIZE, overlap=CHUNK_OVERLAP):
    chunks, start = [], 0
    while start < len(text):
        chunks.append(text[start : start + size])
        start += size - overlap
    return chunks

def extract_text(filepath, filename):
    if filename.lower().endswith(".pdf"):
        doc = fitz.open(filepath)
        text = "".join(page.get_text() for page in doc)
        doc.close()
        return text
    else:
        with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
            return f.read()

def vision_ocr_pdf(filepath):
    groq_key = os.environ.get("GROQ_API_KEY")
    if not groq_key:
        return ""
    
    client = groq.Groq(api_key=groq_key)
    doc = fitz.open(filepath)
    
    def process_page(page_num):
        page = doc[page_num]
        pix = page.get_pixmap(matrix=fitz.Matrix(1.5, 1.5))
        img_data = pix.tobytes("png")
        base64_img = base64.b64encode(img_data).decode('utf-8')
        
        try:
            prompt = "Extract all text from this handwritten note. Return ONLY raw text."
            response = client.chat.completions.create(
                model="llama-3.2-90b-vision-preview",
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": prompt},
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/png;base64,{base64_img}",
                                }
                            }
                        ]
                    }
                ]
            )
            if response.choices:
                return response.choices[0].message.content
        except Exception as e:
            logger.warning(f"Vision OCR Error: {e}")
        return ""

    from concurrent.futures import ThreadPoolExecutor
    with ThreadPoolExecutor(max_workers=1) as executor:
        results = list(executor.map(process_page, range(len(doc))))
            
    doc.close()
    return "\n\n".join([r for r in results if r])

logger = logging.getLogger(__name__)

class DataIngestionPipeline:
    def __init__(self):
        self.client = get_chroma_client()
        self.collection = ensure_collection(self.client)
        self.model = load_model()

    def run(self, path: str, filename: str, ext: str):
        try:
            logger.info(f"Starting Data Ingestion Pipeline for: {filename}")
            text = extract_text(path, filename)
            
            # OCR fallback for purely scanned PDFs
            if not text.strip() and ext == ".pdf":
                logger.info(f"Extracting OCR for {filename}...")
                text = vision_ocr_pdf(path)
                
            if text.strip():
                chunks = chunk_text(text)
                logger.info(f"Generated {len(chunks)} chunks. Embedding now...")
                
                vectors = self.model.encode(chunks, batch_size=4)
                
                ids = [f"text::{filename}::{j}" for j in range(len(chunks))]
                embeddings = [v.tolist() if hasattr(v, 'tolist') else v for v in vectors]
                metadatas = [{"text": c, "source": filename, "type": "text"} for c in chunks]
                
                self.collection.upsert(
                    ids=ids,
                    embeddings=embeddings,
                    metadatas=metadatas,
                    documents=chunks
                )
                logger.info(f"Successfully finished ingestion pipeline for: {filename}")
                return True
            else:
                logger.warning(f"No text extracted for {filename}. Ingestion aborted.")
                return False
                
        except Exception as e:
            logger.error(f"Pipeline processing error for {filename}: {e}")
            raise e
