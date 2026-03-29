from fastapi import APIRouter, UploadFile, File, HTTPException
from typing import List
import os
import tempfile
from models.schemas import FileUploadResponse, FileDeleteRequest, BasicResponse
from services.ai_logic import (
    get_endee, ensure_index, extract_text, vision_ocr_pdf, chunk_text, 
    load_model, get_indexed_files, delete_by_filename
)

router = APIRouter()

@router.post("/upload", response_model=List[FileUploadResponse])
async def upload_files(files: List[UploadFile] = File(...)):
    client = get_endee()
    idx = ensure_index(client)
    model = load_model()
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
                
            text = extract_text(path, file.filename)
            if not text.strip() and ext == ".pdf":
                text = vision_ocr_pdf(path)
                
            if text.strip():
                chunks = chunk_text(text)
                # Use a small batch_size to prevent Out Of Memory crashes on Render Free Tier
                vectors = model.encode(chunks, batch_size=4)
                payloads = [{
                    "id": f"text::{file.filename}::{j}",
                    "vector": v.tolist(),
                    "meta": {"text": c, "source": file.filename, "type": "text"},
                    "filter": {"source": file.filename}
                } for j, (c, v) in enumerate(zip(chunks, vectors))]
                idx.upsert(payloads)
                responses.append(FileUploadResponse(filename=file.filename, status="success", message="Indexed successfully"))
            else:
                responses.append(FileUploadResponse(filename=file.filename, status="skipped", message="No text extracted"))
                
            os.unlink(path)
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
