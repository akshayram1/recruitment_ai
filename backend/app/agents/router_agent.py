"""Router agent for intent classification"""
import json
from typing import Dict, Any, Optional
from openai import AsyncOpenAI

from app.config import get_settings
from app.prompts.loader import PromptManager
from app.services.langfuse_service import LangfuseService

settings = get_settings()


class RouterAgent:
    """Agent for classifying user intent and routing to appropriate handlers"""
    
    INTENTS = [
        "upload_resume",
        "upload_job",
        "search_candidates",
        "search_jobs",
        "chat_resume",
        "chat_job",
        "general_chat"
    ]
    
    def __init__(self):
        self.client = AsyncOpenAI(api_key=settings.openai_api_key)
        self.model = settings.openai_chat_model
        self.langfuse = LangfuseService()
    
    async def classify_intent(
        self,
        user_message: str,
        user_role: str,
        context: Optional[str] = None,
        trace_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Classify user intent from their message"""
        
        generation = None
        if trace_id:
            generation = self.langfuse.start_generation(
                trace_id=trace_id,
                name="router_agent",
                model=self.model,
                input={"message": user_message, "role": user_role}
            )
        
        try:
            system_prompt = PromptManager.get_system_prompt("router")
            user_prompt = PromptManager.get_user_prompt(
                "router",
                user_role=user_role,
                user_message=user_message,
                context=context or "No additional context"
            )
            
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                response_format={"type": "json_object"},
                temperature=0.1
            )
            
            result = json.loads(response.choices[0].message.content)
            
            # Validate intent
            if result.get("intent") not in self.INTENTS:
                result["intent"] = "general_chat"
            
            if generation:
                self.langfuse.end_generation(
                    generation,
                    output=result,
                    usage={
                        "input_tokens": response.usage.prompt_tokens,
                        "output_tokens": response.usage.completion_tokens,
                        "total_tokens": response.usage.total_tokens
                    }
                )
            
            return result
            
        except Exception as e:
            if generation:
                self.langfuse.end_generation(generation, error=str(e))
            
            # Default to general chat on error
            return {
                "intent": "general_chat",
                "confidence": 0.5,
                "entities": {},
                "error": str(e)
            }
    
    def get_handler_for_intent(self, intent: str) -> str:
        """Get the handler name for a given intent"""
        handlers = {
            "upload_resume": "resume_parser_agent",
            "upload_job": "job_parser_agent",
            "search_candidates": "search_agent",
            "search_jobs": "search_agent",
            "chat_resume": "chat_agent",
            "chat_job": "chat_agent",
            "general_chat": "chat_agent"
        }
        return handlers.get(intent, "chat_agent")
