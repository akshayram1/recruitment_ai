"""Search agent for semantic search"""
import json
from typing import List, Dict, Any, Optional
from uuid import UUID
from openai import AsyncOpenAI

from app.config import get_settings
from app.prompts.loader import PromptManager
from app.services.langfuse_service import LangfuseService
from app.services.embedding_service import EmbeddingService
from app.services.qdrant_service import QdrantService
from app.models.search import CandidateMatch, JobMatch
from app.db.repositories import ResumeRepository, JobRepository

settings = get_settings()


class SearchAgent:
    """Agent for semantic search of candidates and jobs"""
    
    def __init__(self):
        self.client = AsyncOpenAI(api_key=settings.openai_api_key)
        self.model = settings.openai_chat_model
        self.langfuse = LangfuseService()
        self.embedding_service = EmbeddingService()
        self.qdrant_service = QdrantService()
        self.resume_repo = ResumeRepository()
        self.job_repo = JobRepository()
    
    async def search_candidates(
        self,
        query: Optional[str] = None,
        job_id: Optional[UUID] = None,
        filters: Optional[Dict[str, Any]] = None,
        limit: int = 10,
        trace_id: Optional[str] = None
    ) -> List[CandidateMatch]:
        """Search for candidates based on query or job ID"""
        
        span = None
        if trace_id:
            span = self.langfuse.start_span(
                trace_id=trace_id,
                name="search_candidates",
                input={"query": query, "job_id": str(job_id) if job_id else None}
            )
        
        try:
            # Generate search query if job_id provided
            if job_id and not query:
                job = await self.job_repo.get_by_id(str(job_id))
                if job:
                    query = await self._generate_candidate_query(job.raw_text, trace_id)
            
            if not query:
                query = "Find qualified candidates"
            
            print(f"[DEBUG] Search query: {query}")
            
            # Detect "show all" type queries - return all candidates without score filtering
            show_all_keywords = [
                "all candidates", "all candidate", "show me candidates", "show me candidate",
                "list candidates", "list candidate", "all the candidates", "all the candidate",
                "every candidate", "available candidates", "available candidate",
                "best match", "best candidates", "matching candidates", "find candidates",
                "show candidates", "show candidate", "candidates for", "candidate for"
            ]
            is_show_all = any(keyword in query.lower() for keyword in show_all_keywords)
            
            # Generate embedding for query
            query_embedding = await self.embedding_service.generate_embedding(
                query,
                trace_id=trace_id
            )
            
            # Search in Qdrant - use 0.0 threshold for "show all" queries, otherwise use lower threshold
            results = self.qdrant_service.search_candidates(
                query_embedding=query_embedding,
                limit=limit,
                filters=filters,
                score_threshold=0.0 if is_show_all else 0.1
            )
            
            print(f"[DEBUG] Qdrant returned {len(results)} results")
            for r in results:
                print(f"  - ID: {r['id']}, Score: {r['score']}")
            
            # Convert to CandidateMatch objects
            candidates = []
            for result in results:
                payload = result.get("payload", {})
                
                # Get full resume data
                resume = await self.resume_repo.get_by_id(result["id"])
                
                match = CandidateMatch(
                    id=UUID(result["id"]),
                    name=payload.get("name", "Unknown"),
                    match_score=round(result["score"] * 100, 1),
                    skills=payload.get("skills", []),
                    experience_years=self._calculate_experience_years(resume) if resume else None,
                    current_role=self._get_current_role(resume) if resume else None,
                    explanation=await self._generate_match_explanation(
                        query, payload, trace_id
                    )
                )
                candidates.append(match)
            
            if span:
                self.langfuse.end_span(span, output={"count": len(candidates)})
            
            return candidates
            
        except Exception as e:
            if span:
                self.langfuse.end_span(span, error=str(e))
            raise
    
    async def search_jobs(
        self,
        query: Optional[str] = None,
        resume_id: Optional[UUID] = None,
        filters: Optional[Dict[str, Any]] = None,
        limit: int = 10,
        trace_id: Optional[str] = None
    ) -> List[JobMatch]:
        """Search for jobs based on query or resume ID"""
        
        span = None
        if trace_id:
            span = self.langfuse.start_span(
                trace_id=trace_id,
                name="search_jobs",
                input={"query": query, "resume_id": str(resume_id) if resume_id else None}
            )
        
        try:
            # Generate search query if resume_id provided
            if resume_id and not query:
                resume = await self.resume_repo.get_by_id(str(resume_id))
                if resume:
                    query = await self._generate_job_query(resume.raw_text, trace_id)
            
            if not query:
                query = "Find relevant job opportunities"
            
            print(f"[DEBUG] Job search query: {query}")
            
            # Detect "show all" type queries - return all jobs without score filtering
            show_all_keywords = [
                "all jobs", "all job", "show me jobs", "show me job", "show jobs", "show job",
                "list jobs", "list job", "all the jobs", "all the job", "every job",
                "available jobs", "available job", "job openings", "job opening",
                "best job", "jobs for me", "job for me", "find jobs", "find job",
                "matching jobs", "matching job", "recommended jobs", "recommended job",
                "available jon", "available position", "open positions"
            ]
            is_show_all = any(keyword in query.lower() for keyword in show_all_keywords)
            
            # Generate embedding for query
            query_embedding = await self.embedding_service.generate_embedding(
                query,
                trace_id=trace_id
            )
            
            # Search in Qdrant - use 0.0 threshold for "show all" queries, otherwise use lower threshold
            results = self.qdrant_service.search_jobs(
                query_embedding=query_embedding,
                limit=limit,
                filters=filters,
                score_threshold=0.0 if is_show_all else 0.1
            )
            
            # Convert to JobMatch objects
            jobs = []
            for result in results:
                payload = result.get("payload", {})
                
                print(f"[DEBUG] Job payload: {payload}")
                
                match = JobMatch(
                    id=UUID(result["id"]),
                    title=payload.get("title") or "Unknown Position",
                    company=payload.get("company") or "Unknown Company",
                    match_score=round(result["score"] * 100, 1),
                    location=payload.get("location"),
                    salary_range=payload.get("salary_range"),
                    required_skills=payload.get("required_skills", []),
                    explanation=await self._generate_match_explanation(
                        query, payload, trace_id
                    )
                )
                jobs.append(match)
            
            if span:
                self.langfuse.end_span(span, output={"count": len(jobs)})
            
            return jobs
            
        except Exception as e:
            if span:
                self.langfuse.end_span(span, error=str(e))
            raise
    
    async def _generate_candidate_query(self, job_text: str, trace_id: Optional[str]) -> str:
        """Generate a search query from job description"""
        system_prompt = PromptManager.get_system_prompt("search_candidates", version="from_job")
        user_prompt = PromptManager.get_user_prompt(
            "search_candidates",
            version="from_job",
            job_description=job_text
        )
        
        response = await self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.3
        )
        
        return response.choices[0].message.content.strip()
    
    async def _generate_job_query(self, resume_text: str, trace_id: Optional[str]) -> str:
        """Generate a search query from resume"""
        system_prompt = PromptManager.get_system_prompt("search_jobs", version="from_resume")
        user_prompt = PromptManager.get_user_prompt(
            "search_jobs",
            version="from_resume",
            resume_text=resume_text
        )
        
        response = await self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.3
        )
        
        return response.choices[0].message.content.strip()
    
    async def _generate_match_explanation(
        self,
        query: str,
        payload: Dict[str, Any],
        trace_id: Optional[str]
    ) -> str:
        """Generate a brief explanation for why this is a match"""
        # Simple explanation based on matching skills
        skills = payload.get("skills", payload.get("required_skills", []))
        if skills:
            return f"Matches on: {', '.join(skills[:3])}"
        return "Semantic match based on overall profile"
    
    def _calculate_experience_years(self, resume) -> Optional[int]:
        """Calculate total years of experience from resume"""
        if not resume or not resume.parsed_data.experience:
            return None
        return len(resume.parsed_data.experience)  # Simplified calculation
    
    def _get_current_role(self, resume) -> Optional[str]:
        """Get current role from resume"""
        if not resume or not resume.parsed_data.experience:
            return None
        
        first_exp = resume.parsed_data.experience[0]
        title = first_exp.title if hasattr(first_exp, 'title') else ""
        company = first_exp.company if hasattr(first_exp, 'company') else ""
        return f"{title} at {company}" if title and company else None
