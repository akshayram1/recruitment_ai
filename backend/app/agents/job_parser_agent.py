"""Job description parser agent"""
import json
from typing import Optional
from uuid import UUID
from openai import AsyncOpenAI

from app.config import get_settings
from app.prompts.loader import PromptManager
from app.services.langfuse_service import LangfuseService
from app.services.embedding_service import EmbeddingService
from app.services.qdrant_service import QdrantService
from app.models.job import Job, ParsedJob
from app.db.repositories import JobRepository

settings = get_settings()


class JobParserAgent:
    """Agent for parsing job descriptions and extracting structured data"""
    
    def __init__(self):
        self.client = AsyncOpenAI(api_key=settings.openai_api_key)
        self.model = settings.openai_chat_model
        self.langfuse = LangfuseService()
        self.embedding_service = EmbeddingService()
        self.qdrant_service = QdrantService()
        self.job_repo = JobRepository()
    
    async def parse_job(
        self,
        job_text: str,
        recruiter_id: UUID,
        file_name: Optional[str] = None,
        trace_id: Optional[str] = None
    ) -> Job:
        """Parse job description text and extract structured data"""
        
        generation = None
        if trace_id:
            generation = self.langfuse.start_generation(
                trace_id=trace_id,
                name="job_parser",
                model=self.model,
                input={"text_length": len(job_text)}
            )
        
        try:
            # Get prompts
            system_prompt = PromptManager.get_system_prompt("job_parser")
            user_prompt = PromptManager.get_user_prompt(
                "job_parser",
                job_text=job_text
            )
            
            # Parse with LLM
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                response_format={"type": "json_object"},
                temperature=0.1
            )
            
            parsed_data = json.loads(response.choices[0].message.content)
            
            # Create ParsedJob object
            parsed_job = ParsedJob(
                title=parsed_data.get("title"),
                company=parsed_data.get("company"),
                location=parsed_data.get("location"),
                required_skills=parsed_data.get("required_skills", []),
                responsibilities=parsed_data.get("responsibilities", []),
                qualifications=parsed_data.get("qualifications", []),
                salary_range=parsed_data.get("salary_range"),
                job_type=parsed_data.get("job_type")
            )
            
            # Create Job object
            job = Job(
                recruiter_id=recruiter_id,
                raw_text=job_text,
                parsed_data=parsed_job,
                file_name=file_name
            )
            
            # Generate embedding for the job
            embedding_text = self._create_embedding_text(parsed_job, job_text)
            embedding = await self.embedding_service.generate_embedding(
                embedding_text,
                trace_id=trace_id
            )
            
            # Store in Qdrant
            self.qdrant_service.upsert_job(
                job_id=job.id,
                recruiter_id=recruiter_id,
                embedding=embedding,
                metadata={
                    "title": parsed_job.title,
                    "company": parsed_job.company,
                    "location": parsed_job.location,
                    "required_skills": parsed_job.required_skills
                }
            )
            
            # Store in database
            await self.job_repo.create(job)
            
            if generation:
                self.langfuse.end_generation(
                    generation,
                    output={"job_id": str(job.id)},
                    usage={
                        "input_tokens": response.usage.prompt_tokens,
                        "output_tokens": response.usage.completion_tokens,
                        "total_tokens": response.usage.total_tokens
                    }
                )
            
            return job
            
        except Exception as e:
            if generation:
                self.langfuse.end_generation(generation, error=str(e))
            raise
    
    def _create_embedding_text(self, parsed_job: ParsedJob, raw_text: str) -> str:
        """Create text for embedding from parsed job"""
        parts = []
        
        if parsed_job.title:
            parts.append(f"Job Title: {parsed_job.title}")
        
        if parsed_job.company:
            parts.append(f"Company: {parsed_job.company}")
        
        if parsed_job.required_skills:
            parts.append(f"Required Skills: {', '.join(parsed_job.required_skills)}")
        
        if parsed_job.responsibilities:
            parts.append(f"Responsibilities: {'; '.join(parsed_job.responsibilities[:5])}")
        
        if parsed_job.qualifications:
            parts.append(f"Qualifications: {'; '.join(parsed_job.qualifications[:5])}")
        
        if not parts:
            # Fallback to raw text
            parts.append(raw_text[:2000])
        
        return "\n".join(parts)
