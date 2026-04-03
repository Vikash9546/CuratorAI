from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks
from typing import List
import os
import tempfile
import logging
from models.schemas import FileUploadResponse, FileDeleteRequest, BasicResponse
from pipelines.db import get_chroma_client, get_indexed_files, delete_by_filename
from pipelines.ingestion import DataIngestionPipeline

router = APIRouter()
logger = logging.getLogger(__name__)

def process_file_background(path: str, filename: str, ext: str):
    """Processes OCR and embeddings in the background using the dedicated Data Ingestion Pipeline."""
    try:
        pipeline = DataIngestionPipeline()
        pipeline.run(path, filename, ext)
    except Exception as e:
        logger.error(f"Background upload error for {filename}: {e}")
    finally:
        os.unlink(path)

@router.post("/upload", response_model=List[FileUploadResponse])
async def upload_files(background_tasks: BackgroundTasks, files: List[UploadFile] = File(...)):
    responses = []
    
    for file in files:
        ext = os.path.splitext(file.filename)[1].lower()
        if ext not in [".pdf", ".txt"]:
            responses.append(FileUploadResponse(filename=file.filename, status="skipped", message="Unsupported extension (Only PDF and TXT allowed)"))
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
    client = get_chroma_client()
    files = get_indexed_files(client)
    return {"files": files}

@router.delete("/files")
async def delete_file(req: FileDeleteRequest):
    client = get_chroma_client()
    success = delete_by_filename(client, req.filename)
    if success:
        return BasicResponse(status="success", message=f"Deleted {req.filename}")
    raise HTTPException(status_code=400, detail="Failed to delete or file not found")

@router.delete("/wipe", response_model=BasicResponse)
async def wipe_collection():
    client = get_chroma_client()
    try:
        client.delete_collection("knowledge_base")
        return BasicResponse(status="success", message="Index wiped successfully")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
