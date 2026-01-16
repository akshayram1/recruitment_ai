"""OpenAI embedding service"""
from typing import List
from openai import AsyncOpenAI

from app.config import get_settings
from app.services.langfuse_service import LangfuseService

settings = get_settings()


class EmbeddingService:
    """Service for generating embeddings using OpenAI"""
    
    def __init__(self):
        self.client = AsyncOpenAI(api_key=settings.openai_api_key)
        self.model = settings.openai_embedding_model
        self.langfuse = LangfuseService()
    
    async def generate_embedding(self, text: str, trace_id: str = None) -> List[float]:
        """Generate embedding for a single text"""
        generation = None
        
        if trace_id:
            generation = self.langfuse.start_generation(
                trace_id=trace_id,
                name="embedding",
                model=self.model,
                input=text[:500]  # Truncate for logging
            )
        
        try:
            response = await self.client.embeddings.create(
                model=self.model,
                input=text
            )
            
            embedding = response.data[0].embedding
            
            if generation:
                self.langfuse.end_generation(
                    generation,
                    output=f"embedding_dim={len(embedding)}",
                    usage={
                        "input_tokens": response.usage.prompt_tokens,
                        "total_tokens": response.usage.total_tokens
                    }
                )
            
            return embedding
            
        except Exception as e:
            if generation:
                self.langfuse.end_generation(generation, error=str(e))
            raise
    
    async def generate_embeddings_batch(
        self, 
        texts: List[str], 
        batch_size: int = 100,
        trace_id: str = None
    ) -> List[List[float]]:
        """Generate embeddings for multiple texts in batches"""
        all_embeddings = []
        
        for i in range(0, len(texts), batch_size):
            batch = texts[i:i + batch_size]
            
            generation = None
            if trace_id:
                generation = self.langfuse.start_generation(
                    trace_id=trace_id,
                    name=f"embedding_batch_{i//batch_size}",
                    model=self.model,
                    input=f"batch_size={len(batch)}"
                )
            
            try:
                response = await self.client.embeddings.create(
                    model=self.model,
                    input=batch
                )
                
                batch_embeddings = [item.embedding for item in response.data]
                all_embeddings.extend(batch_embeddings)
                
                if generation:
                    self.langfuse.end_generation(
                        generation,
                        output=f"embeddings_generated={len(batch_embeddings)}",
                        usage={
                            "input_tokens": response.usage.prompt_tokens,
                            "total_tokens": response.usage.total_tokens
                        }
                    )
                    
            except Exception as e:
                if generation:
                    self.langfuse.end_generation(generation, error=str(e))
                raise
        
        return all_embeddings
