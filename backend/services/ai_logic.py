import os
import time
import fitz  # PyMuPDF
from endee import Endee, Precision
import endee.index
from dotenv import load_dotenv
import PIL.Image
import io
from concurrent.futures import ThreadPoolExecutor
from google import genai
import logging

load_dotenv()
logger = logging.getLogger(__name__)

# --- FIX: Monkey-patch Endee Client Bug (from app.py) ---
def patched_is_hybrid(self):
    return bool(self.sparse_model and self.sparse_model.lower() != "none")
endee.index.Index.is_hybrid = property(patched_is_hybrid)
# ------------------------------------------

INDEX_NAME = "knowledge_base"
CHUNK_SIZE = 500
CHUNK_OVERLAP = 50
DIMENSION = 768

# Singleton pattern for the loaded model to replace @st.cache_resource
_MODEL_INSTANCE = None

class GeminiEmbedder:
    def __init__(self):
        api_key = os.environ.get("GEMINI_API_KEY")
        self.client = genai.Client(api_key=api_key) if api_key else None

    def encode(self, texts, batch_size=4):
        if self.client is None: return [[0.0] * DIMENSION for _ in texts]
        if isinstance(texts, str): texts = [texts]
        out = []
        
        models_to_try = [
            "text-embedding-004", 
            "models/text-embedding-004", 
            "gemini-embedding-exp-03-07", 
            "gemini-embedding-001", 
            "models/gemini-embedding-001"
        ]
        active_model = None

        try:
            from google.genai import types
            for i in range(0, len(texts), batch_size):
                batch = texts[i:i+batch_size]
                res = None
                
                # Try fallback models until we find one that doesn't 404
                for m_name in models_to_try:
                    try:
                        res = self.client.models.embed_content(
                            model=m_name, 
                            contents=batch,
                            config=types.EmbedContentConfig(output_dimensionality=DIMENSION)
                        )
                        active_model = m_name
                        break
                    except Exception as try_err:
                        if "404" in str(try_err) or "not found" in str(try_err).lower(): continue
                        raise try_err
                
                if not res: raise ValueError("No valid embedding model found for this API Key.")
                
                if hasattr(res, 'embeddings'):
                    out.extend([e.values for e in res.embeddings])
                else: 
                     out.extend([res.embeddings[0].values] * len(batch))
                     
        except Exception as e:
            logger.error(f"Gemini API Embedding Error: {e}")
            out.extend([[0.0] * DIMENSION for _ in texts])
        
        while len(out) < len(texts): out.append([0.0] * DIMENSION)
        return out[:len(texts)]

def load_model():
    global _MODEL_INSTANCE
    if _MODEL_INSTANCE is None:
        logger.info("Loading Lightweight Gemini Embedder...")
        _MODEL_INSTANCE = GeminiEmbedder()
    return _MODEL_INSTANCE

def get_endee():
    client = Endee()
    remote_url = os.environ.get("NDD_URL")
    if remote_url:
        client.set_base_url(remote_url)
    return client

def ensure_index(client):
    try:
        return client.get_index(name=INDEX_NAME)
    except Exception as e:
        raw_error = str(e).lower()
        if "not found" in raw_error or "404" in raw_error:
            client.create_index(
                name=INDEX_NAME, 
                dimension=DIMENSION, 
                space_type="cosine", 
                precision=Precision.FLOAT32, 
                sparse_model="None"
            )
            return client.get_index(name=INDEX_NAME)
        logger.error(f"Endee Connection Error: {e}")
        raise e

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
    """Uses Gemini Vision to read handwritten notes with model fallback for robustness."""
    gemini_key = os.environ.get("GEMINI_API_KEY")
    if not gemini_key:
        return ""
    
    gen_client = genai.Client()
    doc = fitz.open(filepath)
    
    def process_page(page_num):
        page = doc[page_num]
        pix = page.get_pixmap(matrix=fitz.Matrix(1.5, 1.5))
        img_data = pix.tobytes("png")
        img = PIL.Image.open(io.BytesIO(img_data))
        
        models_to_try = ["models/gemini-flash-latest", "models/gemini-2.0-flash", "models/gemini-3-flash-preview"]
        for model_name in models_to_try:
            try:
                prompt = "Extract all text from this handwritten note. Return ONLY raw text."
                response = gen_client.models.generate_content(model=model_name, contents=[prompt, img])
                if response.text:
                    return response.text
            except Exception as e:
                logger.warning(f"Vision OCR Error with {model_name}: {e}")
                continue
        return ""

    with ThreadPoolExecutor(max_workers=1) as executor:
        results = list(executor.map(process_page, range(len(doc))))
            
    doc.close()
    return "\n\n".join([r for r in results if r])

def delete_by_filename(client, filename):
    try:
        idx = ensure_index(client)
        if idx:
            idx.delete_with_filter([{"source": {"$eq": filename}}])
            return True
    except Exception as e: 
        logger.error(f"Error deleting file {filename}: {e}")
    return False

def get_indexed_files(client):
    try:
        idx = ensure_index(client)
        if idx:
            # Query with a dummy vector to find unique sources
            results = idx.query(vector=[0.0]*DIMENSION, top_k=100)
            sources = set(r["meta"]["source"] for r in results if "meta" in r and "source" in r["meta"])
            return sorted(list(sources))
    except Exception as e: 
        logger.error(f"Error getting indexed files: {e}")
    return []

# Remove @st.cache_data, you might want to use lru_cache for normal caching, or rely on fast models.
def get_llm_response(prompt_text):
    current_key = os.environ.get("GEMINI_API_KEY")
    if not current_key: 
        logger.error("GEMINI_API_KEY not set.")
        return None
        
    gen_client = genai.Client(api_key=current_key, http_options={'api_version': 'v1'})
    models_to_try = ["models/gemini-2.5-flash", "models/gemini-3-flash-preview", "models/gemini-2.0-flash"]
    
    for model_name in models_to_try:
        max_retries = 3
        for attempt in range(max_retries):
            try:
                resp = gen_client.models.generate_content(model=model_name, contents=prompt_text)
                if resp.text: return resp.text
            except Exception as e:
                err_str = str(e).lower()
                logger.error(f"Gemini {model_name} (Attempt {attempt+1}): {e}")
                
                # Check for transient errors (Over quota, Outage, etc.)
                if any(x in err_str for x in ["429", "500", "503", "quota", "overloaded", "capacity"]):
                    wait_time = (2 ** attempt) + 1 # Exponential backoff: 2s, 3s, 5s...
                    time.sleep(wait_time)
                    continue
                else:
                    break # Fatal error (e.g. invalid key), don't retry this model
    return None
