from pydantic import BaseModel
from typing import List, Optional, Dict, Any

class Message(BaseModel):
    role: str
    content: str

class PredictRequest(BaseModel):
    query: str
    history: Optional[List[Message]] = []

class PredictResponse(BaseModel):
    response: str
    contexts: Optional[List[str]] = []

class FileUploadResponse(BaseModel):
    filename: str
    status: str
    message: str

class FileDeleteRequest(BaseModel):
    filename: str

class BasicResponse(BaseModel):
    status: str
    message: str
