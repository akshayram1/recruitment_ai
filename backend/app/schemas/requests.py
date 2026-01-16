"""Request schemas"""
from typing import Optional, List, Any, Dict
from pydantic import BaseModel, EmailStr
from uuid import UUID


class RegisterRequest(BaseModel):
    """User registration request"""
    email: EmailStr
    password: str
    name: str
    company: Optional[str] = None  # Required for recruiters


class LoginRequest(BaseModel):
    """User login request"""
    email: EmailStr
    password: str


class RefreshTokenRequest(BaseModel):
    """Token refresh request"""
    refresh_token: str


class ResumeUploadRequest(BaseModel):
    """Resume upload request (for raw text)"""
    content: str
    file_name: Optional[str] = None


class JobUploadRequest(BaseModel):
    """Job upload request (for raw text)"""
    content: str
    file_name: Optional[str] = None


class ChatMessageRequest(BaseModel):
    """Chat message request"""
    message: str
    session_id: Optional[UUID] = None
    context_type: Optional[str] = None
    context_ids: Optional[List[UUID]] = None


class SearchQueryRequest(BaseModel):
    """Search query request"""
    query: Optional[str] = None
    reference_id: Optional[UUID] = None
    filters: Dict[str, Any] = {}
    limit: int = 10
    offset: int = 0
