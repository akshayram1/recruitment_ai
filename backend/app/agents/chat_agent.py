"""Chat agent for conversational AI"""
import json
from typing import List, Dict, Any, Optional
from uuid import UUID
from openai import AsyncOpenAI

from app.config import get_settings
from app.prompts.loader import PromptManager
from app.services.langfuse_service import LangfuseService
from app.models.chat import ChatMessage, ChatSession, MessageRole, UIComponent, Action
from app.models.user import UserRole
from app.db.repositories import ResumeRepository, JobRepository, ChatRepository

settings = get_settings()


class ChatAgent:
    """Agent for context-aware conversational interactions"""
    
    def __init__(self):
        self.client = AsyncOpenAI(api_key=settings.openai_api_key)
        self.model = settings.openai_chat_model
        self.langfuse = LangfuseService()
        self.resume_repo = ResumeRepository()
        self.job_repo = JobRepository()
        self.chat_repo = ChatRepository()
    
    async def chat(
        self,
        user_message: str,
        user_id: UUID,
        user_role: UserRole,
        session_id: Optional[UUID] = None,
        context_type: Optional[str] = None,
        context_ids: Optional[List[UUID]] = None,
        trace_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Process a chat message and generate response"""
        
        generation = None
        if trace_id:
            generation = self.langfuse.start_generation(
                trace_id=trace_id,
                name="chat_agent",
                model=self.model,
                input={"message": user_message, "role": user_role.value}
            )
        
        try:
            # Get or create session
            session = None
            if session_id:
                session = await self.chat_repo.get_session(str(session_id))
            
            if not session:
                session = ChatSession(
                    user_id=user_id,
                    context_type=context_type,
                    context_ids=context_ids or []
                )
                await self.chat_repo.create_session(session)
            
            # Get conversation history
            history = await self.chat_repo.get_messages(str(session.id))
            
            # Build context
            context = await self._build_context(
                user_role=user_role,
                context_type=session.context_type,
                context_ids=session.context_ids
            )
            
            # Get appropriate prompt
            prompt_name = "chat_candidate" if user_role == UserRole.CANDIDATE else "chat_recruiter"
            
            system_prompt = PromptManager.get_system_prompt(
                prompt_name,
                resume_context=context.get("resume_context", ""),
                job_context=context.get("job_context", ""),
                candidates_context=context.get("candidates_context", ""),
                context=json.dumps(context)
            )
            
            # Build messages
            messages = [{"role": "system", "content": system_prompt}]
            
            # Add history (last 10 messages)
            for msg in history[-10:]:
                messages.append({
                    "role": msg.role,
                    "content": msg.content
                })
            
            # Add current message
            messages.append({"role": "user", "content": user_message})
            
            # Generate response
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=0.7
            )
            
            assistant_message = response.choices[0].message.content
            
            # Save messages to history
            user_chat_msg = ChatMessage(
                session_id=session.id,
                role=MessageRole.USER,
                content=user_message
            )
            await self.chat_repo.add_message(user_chat_msg)
            
            # Generate UI components if applicable
            ui_components, actions = await self._generate_ui_components(
                assistant_message,
                user_role,
                context
            )
            
            assistant_chat_msg = ChatMessage(
                session_id=session.id,
                role=MessageRole.ASSISTANT,
                content=assistant_message,
                ui_components=ui_components,
                actions=actions
            )
            await self.chat_repo.add_message(assistant_chat_msg)
            
            if generation:
                self.langfuse.end_generation(
                    generation,
                    output={"response_length": len(assistant_message)},
                    usage={
                        "input_tokens": response.usage.prompt_tokens,
                        "output_tokens": response.usage.completion_tokens,
                        "total_tokens": response.usage.total_tokens
                    }
                )
            
            return {
                "message": assistant_message,
                "session_id": session.id,
                "ui_components": [c.model_dump() for c in ui_components],
                "actions": [a.model_dump() for a in actions]
            }
            
        except Exception as e:
            if generation:
                self.langfuse.end_generation(generation, error=str(e))
            raise
    
    async def _build_context(
        self,
        user_role: UserRole,
        context_type: Optional[str],
        context_ids: List[UUID]
    ) -> Dict[str, Any]:
        """Build context for the chat based on context type"""
        context = {}
        
        if not context_type or not context_ids:
            return context
        
        if context_type == "resume":
            # Single resume context
            resume = await self.resume_repo.get_by_id(str(context_ids[0]))
            if resume:
                context["resume_context"] = json.dumps(resume.parsed_data.model_dump())
        
        elif context_type == "job":
            # Single job context
            job = await self.job_repo.get_by_id(str(context_ids[0]))
            if job:
                context["job_context"] = json.dumps(job.parsed_data.model_dump())
        
        elif context_type == "multi_resume":
            # Multiple resumes context
            resumes = []
            for rid in context_ids:
                resume = await self.resume_repo.get_by_id(str(rid))
                if resume:
                    resumes.append(resume.parsed_data.model_dump())
            context["candidates_context"] = json.dumps(resumes)
        
        elif context_type == "resume_job":
            # Resume and job context
            if len(context_ids) >= 2:
                resume = await self.resume_repo.get_by_id(str(context_ids[0]))
                job = await self.job_repo.get_by_id(str(context_ids[1]))
                if resume:
                    context["resume_context"] = json.dumps(resume.parsed_data.model_dump())
                if job:
                    context["job_context"] = json.dumps(job.parsed_data.model_dump())
        
        return context
    
    async def _generate_ui_components(
        self,
        message: str,
        user_role: UserRole,
        context: Dict[str, Any]
    ) -> tuple[List[UIComponent], List[Action]]:
        """Generate UI components for Thesys based on response"""
        ui_components = []
        actions = []
        
        # This is a simplified implementation
        # In production, you would analyze the message and context
        # to generate appropriate UI components
        
        # Example: If discussing a resume, add a ResumeViewer component
        if "resume_context" in context:
            resume_data = json.loads(context["resume_context"])
            if resume_data.get("skills"):
                ui_components.append(UIComponent(
                    type="SkillTags",
                    props={"skills": resume_data["skills"][:10]}
                ))
        
        # Example: Add action buttons for common operations
        if user_role == UserRole.RECRUITER:
            actions.append(Action(
                type="button",
                label="Search Similar Candidates",
                action="search_candidates",
                params={}
            ))
        else:
            actions.append(Action(
                type="button",
                label="Find Matching Jobs",
                action="search_jobs",
                params={}
            ))
        
        return ui_components, actions
