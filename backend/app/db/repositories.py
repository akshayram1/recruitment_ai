"""Data access layer repositories"""
from typing import Optional, List
from uuid import UUID
from sqlalchemy import select, update, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import async_session, UserTable, ResumeTable, JobTable, ChatSessionTable, ChatMessageTable
from app.models.user import User, UserProfile, UserRole
from app.models.resume import Resume, ParsedResume
from app.models.job import Job, ParsedJob
from app.models.chat import ChatSession, ChatMessage


class UserRepository:
    """User data access repository"""
    
    async def create(self, user: User) -> User:
        """Create a new user"""
        async with async_session() as session:
            db_user = UserTable(
                id=str(user.id),
                email=user.email,
                password_hash=user.password_hash,
                role=user.role.value,
                profile=user.profile.model_dump(),
                created_at=user.created_at
            )
            session.add(db_user)
            await session.commit()
            return user
    
    async def get_by_id(self, user_id: str) -> Optional[User]:
        """Get user by ID"""
        async with async_session() as session:
            result = await session.execute(
                select(UserTable).where(UserTable.id == str(user_id))
            )
            db_user = result.scalar_one_or_none()
            if db_user:
                return self._to_model(db_user)
            return None
    
    async def get_by_email(self, email: str) -> Optional[User]:
        """Get user by email"""
        async with async_session() as session:
            result = await session.execute(
                select(UserTable).where(UserTable.email == email)
            )
            db_user = result.scalar_one_or_none()
            if db_user:
                return self._to_model(db_user)
            return None
    
    def _to_model(self, db_user: UserTable) -> User:
        """Convert database row to model"""
        return User(
            id=UUID(db_user.id),
            email=db_user.email,
            password_hash=db_user.password_hash,
            role=UserRole(db_user.role),
            profile=UserProfile(**db_user.profile),
            created_at=db_user.created_at
        )


class ResumeRepository:
    """Resume data access repository"""
    
    async def create(self, resume: Resume) -> Resume:
        """Create a new resume"""
        async with async_session() as session:
            db_resume = ResumeTable(
                id=str(resume.id),
                candidate_id=str(resume.candidate_id),
                raw_text=resume.raw_text,
                parsed_data=resume.parsed_data.model_dump(),
                file_name=resume.file_name,
                file_type=resume.file_type,
                created_at=resume.created_at,
                updated_at=resume.updated_at
            )
            session.add(db_resume)
            await session.commit()
            return resume
    
    async def get_by_id(self, resume_id: str) -> Optional[Resume]:
        """Get resume by ID"""
        async with async_session() as session:
            result = await session.execute(
                select(ResumeTable).where(ResumeTable.id == str(resume_id))
            )
            db_resume = result.scalar_one_or_none()
            if db_resume:
                return self._to_model(db_resume)
            return None
    
    async def get_by_candidate_id(self, candidate_id: str) -> Optional[Resume]:
        """Get resume by candidate ID"""
        async with async_session() as session:
            result = await session.execute(
                select(ResumeTable).where(ResumeTable.candidate_id == str(candidate_id))
            )
            db_resume = result.scalar_one_or_none()
            if db_resume:
                return self._to_model(db_resume)
            return None
    
    async def update(self, resume: Resume) -> Resume:
        """Update a resume"""
        async with async_session() as session:
            await session.execute(
                update(ResumeTable)
                .where(ResumeTable.id == str(resume.id))
                .values(
                    raw_text=resume.raw_text,
                    parsed_data=resume.parsed_data.model_dump(),
                    updated_at=resume.updated_at
                )
            )
            await session.commit()
            return resume
    
    def _to_model(self, db_resume: ResumeTable) -> Resume:
        """Convert database row to model"""
        return Resume(
            id=UUID(db_resume.id),
            candidate_id=UUID(db_resume.candidate_id),
            raw_text=db_resume.raw_text,
            parsed_data=ParsedResume(**db_resume.parsed_data),
            file_name=db_resume.file_name,
            file_type=db_resume.file_type,
            created_at=db_resume.created_at,
            updated_at=db_resume.updated_at
        )


class JobRepository:
    """Job data access repository"""
    
    async def create(self, job: Job) -> Job:
        """Create a new job"""
        async with async_session() as session:
            db_job = JobTable(
                id=str(job.id),
                recruiter_id=str(job.recruiter_id),
                raw_text=job.raw_text,
                parsed_data=job.parsed_data.model_dump(),
                file_name=job.file_name,
                created_at=job.created_at,
                updated_at=job.updated_at
            )
            session.add(db_job)
            await session.commit()
            return job
    
    async def get_by_id(self, job_id: str) -> Optional[Job]:
        """Get job by ID"""
        async with async_session() as session:
            result = await session.execute(
                select(JobTable).where(JobTable.id == str(job_id))
            )
            db_job = result.scalar_one_or_none()
            if db_job:
                return self._to_model(db_job)
            return None
    
    async def get_by_recruiter_id(self, recruiter_id: str) -> List[Job]:
        """Get all jobs by recruiter ID"""
        async with async_session() as session:
            result = await session.execute(
                select(JobTable).where(JobTable.recruiter_id == str(recruiter_id))
            )
            db_jobs = result.scalars().all()
            return [self._to_model(db_job) for db_job in db_jobs]
    
    async def update(self, job: Job) -> Job:
        """Update a job"""
        async with async_session() as session:
            await session.execute(
                update(JobTable)
                .where(JobTable.id == str(job.id))
                .values(
                    parsed_data=job.parsed_data.model_dump(),
                    updated_at=job.updated_at
                )
            )
            await session.commit()
            return job
    
    async def delete(self, job_id: str) -> bool:
        """Delete a job"""
        async with async_session() as session:
            result = await session.execute(
                delete(JobTable).where(JobTable.id == str(job_id))
            )
            await session.commit()
            return result.rowcount > 0
    
    def _to_model(self, db_job: JobTable) -> Job:
        """Convert database row to model"""
        return Job(
            id=UUID(db_job.id),
            recruiter_id=UUID(db_job.recruiter_id),
            raw_text=db_job.raw_text,
            parsed_data=ParsedJob(**db_job.parsed_data),
            file_name=db_job.file_name,
            created_at=db_job.created_at,
            updated_at=db_job.updated_at
        )


class ChatRepository:
    """Chat data access repository"""
    
    async def create_session(self, session: ChatSession) -> ChatSession:
        """Create a new chat session"""
        async with async_session() as db:
            db_session = ChatSessionTable(
                id=str(session.id),
                user_id=str(session.user_id),
                context_type=session.context_type,
                context_ids=[str(cid) for cid in session.context_ids],
                created_at=session.created_at,
                updated_at=session.updated_at
            )
            db.add(db_session)
            await db.commit()
            return session
    
    async def get_session(self, session_id: str) -> Optional[ChatSession]:
        """Get chat session by ID"""
        async with async_session() as db:
            result = await db.execute(
                select(ChatSessionTable).where(ChatSessionTable.id == str(session_id))
            )
            db_session = result.scalar_one_or_none()
            if db_session:
                return ChatSession(
                    id=UUID(db_session.id),
                    user_id=UUID(db_session.user_id),
                    context_type=db_session.context_type,
                    context_ids=[UUID(cid) for cid in db_session.context_ids],
                    created_at=db_session.created_at,
                    updated_at=db_session.updated_at
                )
            return None
    
    async def add_message(self, message: ChatMessage) -> ChatMessage:
        """Add a message to a chat session"""
        async with async_session() as db:
            db_message = ChatMessageTable(
                id=str(message.id),
                session_id=str(message.session_id),
                role=message.role.value,
                content=message.content,
                ui_components=[c.model_dump() for c in message.ui_components],
                actions=[a.model_dump() for a in message.actions],
                created_at=message.created_at
            )
            db.add(db_message)
            await db.commit()
            return message
    
    async def get_messages(self, session_id: str) -> List[ChatMessage]:
        """Get all messages for a chat session"""
        async with async_session() as db:
            result = await db.execute(
                select(ChatMessageTable)
                .where(ChatMessageTable.session_id == str(session_id))
                .order_by(ChatMessageTable.created_at)
            )
            db_messages = result.scalars().all()
            return [
                ChatMessage(
                    id=UUID(msg.id),
                    session_id=UUID(msg.session_id),
                    role=msg.role,
                    content=msg.content,
                    created_at=msg.created_at
                )
                for msg in db_messages
            ]
