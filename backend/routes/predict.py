from fastapi import APIRouter, HTTPException
from models.schemas import PredictRequest, PredictResponse
from services.ai_logic import load_model, get_endee, ensure_index, get_llm_response
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

@router.post("/predict", response_model=PredictResponse)
async def predict(request: PredictRequest):
    try:
        model = load_model()
        
        # --- Graceful RAG: try Endee, but don't fail if it's down ---
        contexts = []
        context_block = "No relevant documents."
        try:
            client = get_endee()
            kb_index = ensure_index(client)
            encoded = model.encode([request.query])[0]
            query_vec = encoded.tolist() if hasattr(encoded, 'tolist') else encoded
            kb_results = kb_index.query(vector=query_vec, top_k=3)
            contexts = [f"[Source: {m.get('meta', {}).get('source', 'Unknown')}] {m.get('meta', {}).get('text', '')}" for m in kb_results]
            context_block = "\n\n---\n\n".join(contexts) if contexts else "No relevant documents."
        except Exception as rag_err:
            logger.warning(f"Endee unavailable, skipping RAG context: {rag_err}")
        
        history_str = "\n".join([f"{msg.role}: {msg.content}" for msg in request.history[-5:]]) if request.history else ""
        
        llm_prompt = f"Context: {context_block}\n\nHistory: {history_str}\n\nUser: {request.query}\n\nAssistant:"
        response_text = get_llm_response(llm_prompt)
        
        if not response_text:
            if contexts:
                best_match = contexts[0] if contexts else ""
                response_text = f"**Note:** My reasoning engine is currently at capacity (API Quota Reached). However, I found this from your knowledge vault:\n\n---\n\n> {best_match}"
            else:
                response_text = "I'm currently unable to generate a response (API Quota reached). Please wait 60 seconds and try again."

        return PredictResponse(response=response_text, contexts=contexts)
        
    except Exception as e:
        logger.error(f"Predict endpoint error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
