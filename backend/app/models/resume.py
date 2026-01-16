"""Resume model"""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field
from uuid import UUID, uuid4


class Experience(BaseModel):
    """Work experience model"""
    title: str
    company: str
    duration: str
    description: Optional[str] = None


class Education(BaseModel):
    """Education model"""
    degree: str
    institution: Optional[str] = None
    year: Optional[str] = None


class ParsedResume(BaseModel):
    """Parsed resume data"""
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    skills: List[str] = Field(default_factory=list)
    experience: List[Experience] = Field(default_factory=list)
    education: List[Education] = Field(default_factory=list)
    summary: Optional[str] = None


class Resume(BaseModel):
    """Resume model"""
    id: UUID = Field(default_factory=uuid4)
    candidate_id: UUID
    raw_text: str
    parsed_data: ParsedResume
    file_name: Optional[str] = None
    file_type: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        from_attributes = True


class ResumeCreate(BaseModel):
    """Resume creation schema"""
    raw_text: str
    file_name: Optional[str] = None
    file_type: Optional[str] = None


class ResumeResponse(BaseModel):
    """Resume response schema"""
    id: UUID
    candidate_id: UUID
    parsed_data: ParsedResume
    file_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime
