import logging
import os
import groq
from pipelines.db import get_chroma_client, ensure_collection, load_model

def get_llm_response(prompt_text):
    groq_api_key = os.environ.get("GROQ_API_KEY")
    if not groq_api_key: 
        logger.error("GROQ_API_KEY not set.")
        return None
        
    client = groq.Groq(api_key=groq_api_key)
    try:
        chat_completion = client.chat.completions.create(
            messages=[
                {
                    "role": "user",
                    "content": prompt_text,
                }
            ],
            model="llama-3.3-70b-versatile",
        )
        return chat_completion.choices[0].message.content
    except Exception as e:
        logger.error(f"Groq API Error: {e}")
        return None

logger = logging.getLogger(__name__)

class RetrievalPipeline:
    def __init__(self):
        self.client = get_chroma_client()
        self.collection = ensure_collection(self.client)
        self.model = load_model()

    def retrieve_context(self, query: str, top_k: int = 3):
        try:
            logger.info("Running contextual retrieval pipeline...")
            encoded = self.model.encode([query])[0]
            query_vec = encoded.tolist() if hasattr(encoded, 'tolist') else encoded
            
            results = self.collection.query(query_embeddings=[query_vec], n_results=top_k)
            metadatas = results["metadatas"][0] if results.get("metadatas") else []
            
            contexts = [f"[Source: {m.get('source', 'Unknown')}] {m.get('text', '')}" for m in metadatas if m]
            return contexts
        except Exception as e:
            logger.warning(f"Retrieval database error: {e}")
            return []

    def generate_answer(self, query: str, contexts: list, history: list):
        context_block = "\n\n---\n\n".join(contexts) if contexts else "No relevant documents."
        
        history_str = "\n".join([f"{msg.role}: {msg.content}" for msg in history[-5:]]) if history else ""
        
        llm_prompt = f"Context: {context_block}\n\nHistory: {history_str}\n\nUser: {query}\n\nAssistant:"
        
        logger.info("Sending synthesized prompt to Groq...")
        response_text = get_llm_response(llm_prompt)
        
        if not response_text:
            if contexts:
                best_match = contexts[0] if contexts else ""
                response_text = f"**Note:** My reasoning engine is currently at capacity. However, I found this from your knowledge vault:\n\n---\n\n> {best_match}"
            else:
                response_text = "I'm currently unable to generate a response (API Error). Please wait 60 seconds and try again."
                
        return response_text

    def run(self, query: str, history: list):
        contexts = self.retrieve_context(query)
        response_text = self.generate_answer(query, contexts, history)
        return response_text, contexts
