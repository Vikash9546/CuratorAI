from fastapi import APIRouter, HTTPException
from models.schemas import PredictRequest, PredictResponse
from services.ai_logic import load_model, get_endee, ensure_index, get_llm_response

router = APIRouter()

@router.post("/predict", response_model=PredictResponse)
async def predict(request: PredictRequest):
    try:
        model = load_model()
        client = get_endee()
        kb_index = ensure_index(client)
        
        query_vec = model.encode([request.query])[0].tolist()
        kb_results = kb_index.query(vector=query_vec, top_k=3)
        
        contexts = [f"[Source: {m.get('meta', {}).get('source', 'Unknown')}] {m.get('meta', {}).get('text', '')}" for m in kb_results]
        context_block = "\n\n---\n\n".join(contexts) if contexts else "No relevant documents."
        
        history_str = "\n".join([f"{msg.role}: {msg.content}" for msg in request.history[-5:]]) if request.history else ""
        
        llm_prompt = f"Context: {context_block}\n\nHistory: {history_str}\n\nUser: {request.query}\n\nAssistant:"
        response_text = get_llm_response(llm_prompt)
        
        if not response_text:
            if kb_results:
                best_match = kb_results[0].get('meta', {}).get('text', '')
                source = kb_results[0].get('meta', {}).get('source', 'Unknown')
                response_text = f"**Note:** My reasoning engine is currently at capacity (API Quota Reach). However, I've retrieved this exact match from your internal knowledge vault:\n\n---\n\n> {best_match}\n\n*Source: {source}*"
            else:
                response_text = "I'm currently unable to generate a response (API Quota reached). Please wait 60 seconds and try again."

        return PredictResponse(response=response_text, contexts=contexts)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
