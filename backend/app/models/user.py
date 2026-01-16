"""User models"""
from datetime import datetime
from enum import Enum
from typing import Optional
from pydantic import BaseModel, EmailStr, Field
from uuid import UUID, uuid4


class UserRole(str, Enum):
    """User role enum"""
    CANDIDATE = "candidate"
    RECRUITER = "recruiter"


class UserProfile(BaseModel):
    """User profile model"""
    name: str
    company: Optional[str] = None  # Recruiter only
    avatar_url: Optional[str] = None


class User(BaseModel):
    """User model"""
    id: UUID = Field(default_factory=uuid4)
    email: EmailStr
    password_hash: str
    role: UserRole
    profile: UserProfile
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        from_attributes = True


class UserCreate(BaseModel):
    """User creation schema"""
    email: EmailStr
    password: str
    name: str
    role: UserRole
    company: Optional[str] = None  # Required for recruiters


class UserLogin(BaseModel):
    """User login schema"""
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    """User response schema (without password)"""
    id: UUID
    email: EmailStr
    role: UserRole
    profile: UserProfile
    created_at: datetime
