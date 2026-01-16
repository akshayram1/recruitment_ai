"""Resume parser agent"""

import json
from typing import Optional
from uuid import UUID
from openai import AsyncOpenAI

from app.config import get_settings
from app.prompts.loader import PromptManager
from app.services.langfuse_service import LangfuseService
from app.services.embedding_service import EmbeddingService
from app.services.qdrant_service import QdrantService
from app.models.resume import Resume, ParsedResume
from app.db.repositories import ResumeRepository

settings = get_settings()


class ResumeParserAgent:
    """Agent for parsing resumes and extracting structured data"""

    def __init__(self):
        self.client = AsyncOpenAI(api_key=settings.openai_api_key)
        self.model = settings.openai_chat_model
        self.langfuse = LangfuseService()
        self.embedding_service = EmbeddingService()
        self.qdrant_service = QdrantService()
        self.resume_repo = ResumeRepository()

    async def parse_resume(
        self,
        resume_text: str,
        candidate_id: UUID,
        file_name: Optional[str] = None,
        trace_id: Optional[str] = None,
    ) -> Resume:
        """Parse resume text and extract structured data"""

        generation = None
        if trace_id:
            generation = self.langfuse.start_generation(
                trace_id=trace_id,
                name="resume_parser",
                model=self.model,
                input={"text_length": len(resume_text)},
            )

        try:
            # Get prompts
            system_prompt = PromptManager.get_system_prompt("resume_parser")
            user_prompt = PromptManager.get_user_prompt(
                "resume_parser", resume_text=resume_text
            )

            # Parse with LLM
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                response_format={"type": "json_object"},
                temperature=0.1,
            )

            parsed_data = json.loads(response.choices[0].message.content)

            # Clean and validate education data
            education_list = parsed_data.get("education", [])
            cleaned_education = []
            for edu in education_list:
                # Only include education entries that have at least a degree
                if edu and isinstance(edu, dict) and edu.get("degree"):
                    cleaned_education.append(
                        {
                            "degree": edu.get("degree", ""),
                            "institution": edu.get("institution")
                            if edu.get("institution")
                            else None,
                            "year": edu.get("year") if edu.get("year") else None,
                        }
                    )

            # Clean and validate experience data
            experience_list = parsed_data.get("experience", [])
            cleaned_experience = []
            for exp in experience_list:
                # Only include experience entries that have at least title and company
                if (
                    exp
                    and isinstance(exp, dict)
                    and exp.get("title")
                    and exp.get("company")
                ):
                    cleaned_experience.append(
                        {
                            "title": exp.get("title", ""),
                            "company": exp.get("company", ""),
                            "duration": exp.get("duration", ""),
                            "description": exp.get("description")
                            if exp.get("description")
                            else None,
                        }
                    )

            # Create ParsedResume object
            parsed_resume = ParsedResume(
                name=parsed_data.get("name"),
                email=parsed_data.get("email"),
                phone=parsed_data.get("phone"),
                skills=parsed_data.get("skills", []),
                experience=cleaned_experience,
                education=cleaned_education,
                summary=parsed_data.get("summary"),
            )

            # Create Resume object
            resume = Resume(
                candidate_id=candidate_id,
                raw_text=resume_text,
                parsed_data=parsed_resume,
                file_name=file_name,
            )

            # Generate embedding for the resume
            embedding_text = self._create_embedding_text(parsed_resume, resume_text)
            embedding = await self.embedding_service.generate_embedding(
                embedding_text, trace_id=trace_id
            )

            # Store in Qdrant
            self.qdrant_service.upsert_resume(
                resume_id=resume.id,
                candidate_id=candidate_id,
                embedding=embedding,
                metadata={
                    "name": parsed_resume.name,
                    "skills": parsed_resume.skills,
                    "summary": parsed_resume.summary,
                },
            )

            # Store in database
            await self.resume_repo.create(resume)

            if generation:
                self.langfuse.end_generation(
                    generation,
                    output={"resume_id": str(resume.id)},
                    usage={
                        "input_tokens": response.usage.prompt_tokens,
                        "output_tokens": response.usage.completion_tokens,
                        "total_tokens": response.usage.total_tokens,
                    },
                )

            return resume

        except Exception as e:
            if generation:
                self.langfuse.end_generation(generation, error=str(e))
            raise

    def _create_embedding_text(self, parsed_resume: ParsedResume, raw_text: str) -> str:
        """Create text for embedding from parsed resume"""
        parts = []

        if parsed_resume.summary:
            parts.append(f"Summary: {parsed_resume.summary}")

        if parsed_resume.skills:
            parts.append(f"Skills: {', '.join(parsed_resume.skills)}")

        for exp in parsed_resume.experience[:3]:  # Top 3 experiences
            exp_text = f"{exp.title or ''} at {exp.company or ''}"
            if exp.description:
                exp_text += f": {exp.description}"
            parts.append(exp_text)

        if not parts:
            # Fallback to raw text
            parts.append(raw_text[:2000])

        return "\n".join(parts)
