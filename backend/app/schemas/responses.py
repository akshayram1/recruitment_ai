"""Response schemas"""
from typing import Optional, List, Any, Dict
from pydantic import BaseModel
from uuid import UUID
from datetime import datetime


class UserResponse(BaseModel):
    """User data in auth response"""
    id: str
    email: str
    name: str
    role: str
    company: Optional[str] = None


class TokenResponse(BaseModel):
    """Authentication token response"""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserResponse


class UserProfileResponse(BaseModel):
    """User profile response"""
    id: UUID
    email: str
    name: str
    role: str
    company: Optional[str] = None
    avatar_url: Optional[str] = None
    created_at: datetime


class ResumeResponse(BaseModel):
    """Resume response"""
    id: UUID
    candidate_id: UUID
    parsed_data: Dict[str, Any]
    file_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class JobResponse(BaseModel):
    """Job response"""
    id: UUID
    recruiter_id: UUID
    parsed_data: Dict[str, Any]
    file_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class UIComponentResponse(BaseModel):
    """UI component for Thesys Gen UI"""
    type: str
    props: Dict[str, Any]


class ActionResponse(BaseModel):
    """Action button for Thesys Gen UI"""
    type: str
    label: str
    action: str
    params: Dict[str, Any] = {}


class ChatMessageResponse(BaseModel):
    """Chat message response for Thesys Gen UI"""
    message: str
    session_id: UUID
    ui_components: List[UIComponentResponse] = []
    actions: List[ActionResponse] = []


class CandidateMatchResponse(BaseModel):
    """Candidate match in search results"""
    id: UUID
    name: str
    match_score: float
    skills: List[str]
    experience_years: Optional[int] = None
    current_role: Optional[str] = None
    explanation: Optional[str] = None


class JobMatchResponse(BaseModel):
    """Job match in search results"""
    id: UUID
    title: str
    company: str
    match_score: float
    location: Optional[str] = None
    required_skills: List[str]
    explanation: Optional[str] = None


class SearchResultsResponse(BaseModel):
    """Search results response"""
    query: str
    total: int
    results: List[Any]


class ErrorResponse(BaseModel):
    """Error response"""
    detail: str
    code: Optional[str] = None
