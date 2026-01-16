"""Search result models"""
from typing import List, Optional, Any, Dict
from pydantic import BaseModel, Field
from uuid import UUID


class CandidateMatch(BaseModel):
    """Candidate match result"""
    id: UUID
    name: str
    match_score: float
    skills: List[str] = Field(default_factory=list)
    experience_years: Optional[int] = None
    current_role: Optional[str] = None
    explanation: Optional[str] = None


class JobMatch(BaseModel):
    """Job match result"""
    id: UUID
    title: str
    company: str = "Unknown Company"
    match_score: float
    location: Optional[str] = None
    salary_range: Optional[str] = None
    required_skills: List[str] = Field(default_factory=list)
    explanation: Optional[str] = None


class SearchRequest(BaseModel):
    """Search request schema"""
    query: Optional[str] = None
    reference_id: Optional[UUID] = None  # Resume ID or Job ID
    filters: Dict[str, Any] = Field(default_factory=dict)
    limit: int = 10


class CandidateSearchResponse(BaseModel):
    """Candidate search response"""
    query: str
    total: int
    candidates: List[CandidateMatch]


class JobSearchResponse(BaseModel):
    """Job search response"""
    query: str
    total: int
    jobs: List[JobMatch]
