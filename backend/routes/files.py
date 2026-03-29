from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks
from typing import List
import os
import tempfile
import logging
from models.schemas import FileUploadResponse, FileDeleteRequest, BasicResponse
from services.ai_logic import (
    get_endee, ensure_index, extract_text, vision_ocr_pdf, chunk_text, 
    load_model, get_indexed_files, delete_by_filename
)

router = APIRouter()
logger = logging.getLogger(__name__)

def process_file_background(path: str, filename: str, ext: str):
    """Processes OCR and embeddings in the background to avoid Render timeout limits."""
    try:
        client = get_endee()
        idx = ensure_index(client)
        model = load_model()
        
        text = extract_text(path, filename)
        # Only use Vision if absolutely zero standard text is found (Scanned PDF)
        if not text.strip() and ext == ".pdf":
            logger.info(f"Extracting OCR for {filename}...")
            text = vision_ocr_pdf(path)
            
        if text.strip():
            chunks = chunk_text(text)
            vectors = model.encode(chunks, batch_size=4)
            payloads = [{
                "id": f"text::{filename}::{j}",
                "vector": v.tolist() if hasattr(v, 'tolist') else v,
                "meta": {"text": c, "source": filename, "type": "text"},
                "filter": {"source": filename}
            } for j, (c, v) in enumerate(zip(chunks, vectors))]
            idx.upsert(payloads)
            logger.info(f"Successfully indexed background file: {filename}")
        else:
            logger.warning(f"No text extracted for {filename}")
            
    except Exception as e:
        logger.error(f"Background upload error for {filename}: {e}")
    finally:
        os.unlink(path)

@router.post("/upload", response_model=List[FileUploadResponse])
async def upload_files(background_tasks: BackgroundTasks, files: List[UploadFile] = File(...)):
    responses = []
    
    for file in files:
        ext = os.path.splitext(file.filename)[1].lower()
        if ext not in [".pdf", ".md", ".txt"]:
            responses.append(FileUploadResponse(filename=file.filename, status="skipped", message="Unsupported extension"))
            continue
            
        try:
            with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as tmp:
                tmp.write(await file.read())
                path = tmp.name
                
            # Add to background queue instead of keeping the browser waiting
            background_tasks.add_task(process_file_background, path, file.filename, ext)
            responses.append(FileUploadResponse(filename=file.filename, status="success", message="Processing in background (Refresh list in 1 minute)"))
        except Exception as e:
            responses.append(FileUploadResponse(filename=file.filename, status="error", message=str(e)))
            
    return responses

@router.get("/files")
async def list_files():
    client = get_endee()
    files = get_indexed_files(client)
    return {"files": files}

@router.delete("/files")
async def delete_file(req: FileDeleteRequest):
    client = get_endee()
    success = delete_by_filename(client, req.filename)
    if success:
        return BasicResponse(status="success", message=f"Deleted {req.filename}")
    raise HTTPException(status_code=400, detail="Failed to delete or file not found")

@router.delete("/wipe", response_model=BasicResponse)
async def wipe_collection():
    client = get_endee()
    try:
        client.delete_index("knowledge_base")
        return BasicResponse(status="success", message="Index wiped successfully")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
