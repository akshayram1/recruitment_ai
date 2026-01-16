"""Job description model"""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field
from uuid import UUID, uuid4


class ParsedJob(BaseModel):
    """Parsed job data"""
    title: Optional[str] = None
    company: Optional[str] = None
    location: Optional[str] = None
    required_skills: List[str] = Field(default_factory=list)
    responsibilities: List[str] = Field(default_factory=list)
    qualifications: List[str] = Field(default_factory=list)
    salary_range: Optional[str] = None
    job_type: Optional[str] = None  # full-time, part-time, contract


class Job(BaseModel):
    """Job model"""
    id: UUID = Field(default_factory=uuid4)
    recruiter_id: UUID
    raw_text: str
    parsed_data: ParsedJob
    file_name: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        from_attributes = True


class JobCreate(BaseModel):
    """Job creation schema"""
    raw_text: str
    file_name: Optional[str] = None


class JobUpdate(BaseModel):
    """Job update schema"""
    parsed_data: Optional[ParsedJob] = None


class JobResponse(BaseModel):
    """Job response schema"""
    id: UUID
    recruiter_id: UUID
    parsed_data: ParsedJob
    file_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime
