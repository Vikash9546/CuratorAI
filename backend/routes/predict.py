from fastapi import APIRouter, HTTPException
from models.schemas import PredictRequest, PredictResponse
from pipelines.retrieval import RetrievalPipeline
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

@router.post("/predict", response_model=PredictResponse)
async def predict(request: PredictRequest):
    try:
        pipeline = RetrievalPipeline()
        response_text, contexts = pipeline.run(request.query, request.history or [])
        
        return PredictResponse(response=response_text, contexts=contexts)
        
    except Exception as e:
        logger.error(f"Predict endpoint error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
