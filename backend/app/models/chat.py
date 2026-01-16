"""Chat/message models"""
from datetime import datetime
from typing import Optional, List, Any, Dict
from pydantic import BaseModel, Field
from uuid import UUID, uuid4
from enum import Enum


class MessageRole(str, Enum):
    """Message role enum"""
    USER = "user"
    ASSISTANT = "assistant"
    SYSTEM = "system"


class UIComponent(BaseModel):
    """UI component for Thesys Gen UI"""
    type: str
    props: Dict[str, Any] = Field(default_factory=dict)


class Action(BaseModel):
    """Action button for Thesys Gen UI"""
    type: str
    label: str
    action: str
    params: Dict[str, Any] = Field(default_factory=dict)


class ChatMessage(BaseModel):
    """Chat message model"""
    id: UUID = Field(default_factory=uuid4)
    session_id: UUID
    role: MessageRole
    content: str
    ui_components: List[UIComponent] = Field(default_factory=list)
    actions: List[Action] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class ChatSession(BaseModel):
    """Chat session model"""
    id: UUID = Field(default_factory=uuid4)
    user_id: UUID
    context_type: str  # "resume", "job", "multi_resume", etc.
    context_ids: List[UUID] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class ChatRequest(BaseModel):
    """Chat request schema"""
    message: str
    session_id: Optional[UUID] = None
    context_type: Optional[str] = None
    context_ids: Optional[List[UUID]] = None


class ChatResponse(BaseModel):
    """Chat response schema for Thesys Gen UI"""
    message: str
    session_id: UUID
    ui_components: List[UIComponent] = Field(default_factory=list)
    actions: List[Action] = Field(default_factory=list)
