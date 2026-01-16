"""Database connection and initialization"""
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import declarative_base
from sqlalchemy import Column, String, DateTime, JSON, Enum as SQLEnum
from datetime import datetime
import enum

from app.config import get_settings

settings = get_settings()

# Convert sqlite:/// to sqlite+aiosqlite:///
database_url = settings.database_url
if database_url.startswith("sqlite:///"):
    database_url = database_url.replace("sqlite:///", "sqlite+aiosqlite:///")

engine = create_async_engine(database_url, echo=settings.debug)
async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

Base = declarative_base()


class UserRoleEnum(str, enum.Enum):
    CANDIDATE = "candidate"
    RECRUITER = "recruiter"


class UserTable(Base):
    """User database table"""
    __tablename__ = "users"
    
    id = Column(String, primary_key=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(String, nullable=False)
    profile = Column(JSON, nullable=False, default={})
    created_at = Column(DateTime, default=datetime.utcnow)


class ResumeTable(Base):
    """Resume database table"""
    __tablename__ = "resumes"
    
    id = Column(String, primary_key=True)
    candidate_id = Column(String, index=True, nullable=False)
    raw_text = Column(String, nullable=False)
    parsed_data = Column(JSON, nullable=False, default={})
    file_name = Column(String, nullable=True)
    file_type = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class JobTable(Base):
    """Job database table"""
    __tablename__ = "jobs"
    
    id = Column(String, primary_key=True)
    recruiter_id = Column(String, index=True, nullable=False)
    raw_text = Column(String, nullable=False)
    parsed_data = Column(JSON, nullable=False, default={})
    file_name = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class ChatSessionTable(Base):
    """Chat session database table"""
    __tablename__ = "chat_sessions"
    
    id = Column(String, primary_key=True)
    user_id = Column(String, index=True, nullable=False)
    context_type = Column(String, nullable=True)
    context_ids = Column(JSON, nullable=False, default=[])
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class ChatMessageTable(Base):
    """Chat message database table"""
    __tablename__ = "chat_messages"
    
    id = Column(String, primary_key=True)
    session_id = Column(String, index=True, nullable=False)
    role = Column(String, nullable=False)
    content = Column(String, nullable=False)
    ui_components = Column(JSON, nullable=False, default=[])
    actions = Column(JSON, nullable=False, default=[])
    created_at = Column(DateTime, default=datetime.utcnow)


async def get_db() -> AsyncSession:
    """Get database session"""
    async with async_session() as session:
        yield session


async def init_db():
    """Initialize database tables"""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
