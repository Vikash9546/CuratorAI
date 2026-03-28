from fastapi import APIRouter
from models.schemas import BasicResponse

router = APIRouter()

@router.get("/", response_model=BasicResponse)
@router.get("/health", response_model=BasicResponse)
async def health_check():
    return BasicResponse(status="ok", message="Curator AI Backend is running")
