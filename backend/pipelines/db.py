import os
import chromadb
import logging
import requests
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

INDEX_NAME = "knowledge_base"
DIMENSION = 768
_MODEL_INSTANCE = None

class HFEmbedder:
    def __init__(self):
        self.api_url = "https://api-inference.huggingface.co/pipeline/feature-extraction/sentence-transformers/all-mpnet-base-v2"
        pass

    def encode(self, texts, batch_size=4):
        if isinstance(texts, str): texts = [texts]
        out = []
        try:
            for i in range(0, len(texts), batch_size):
                batch = texts[i:i+batch_size]
                response = requests.post(self.api_url, json={"inputs": batch})
                if response.status_code == 200:
                    out.extend(response.json())
                else:
                    logger.error(f"HF Embed API Error: {response.text}")
                    out.extend([[0.0] * DIMENSION for _ in batch])
        except Exception as e:
            logger.error(f"Embedding Error: {e}")
            out.extend([[0.0] * DIMENSION for _ in texts])
        
        while len(out) < len(texts): out.append([0.0] * DIMENSION)
        return out[:len(texts)]

def load_model():
    global _MODEL_INSTANCE
    if _MODEL_INSTANCE is None:
        logger.info("Loading Lightweight HF Embedder...")
        _MODEL_INSTANCE = HFEmbedder()
    return _MODEL_INSTANCE

def get_chroma_client():
    db_path = os.environ.get("CHROMA_DB_PATH", "./chroma_db")
    return chromadb.PersistentClient(path=db_path)

def ensure_collection(client):
    return client.get_or_create_collection(name=INDEX_NAME)

def delete_by_filename(client, filename):
    try:
        col = ensure_collection(client)
        col.delete(where={"source": filename})
        return True
    except Exception as e: 
        logger.error(f"Error deleting file {filename}: {e}")
    return False

def get_indexed_files(client):
    try:
        col = ensure_collection(client)
        results = col.get(include=["metadatas"])
        sources = set(meta["source"] for meta in results.get("metadatas", []) if meta and "source" in meta)
        return sorted(list(sources))
    except Exception as e: 
        logger.error(f"Error getting indexed files: {e}")
    return []
