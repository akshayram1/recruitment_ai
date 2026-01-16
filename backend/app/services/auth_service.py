"""Authentication service"""
from datetime import datetime, timedelta
from typing import Optional
from uuid import UUID, uuid4
from jose import JWTError, jwt
from passlib.context import CryptContext

from app.config import get_settings
from app.models.user import User, UserRole, UserProfile, UserCreate
from app.db.repositories import UserRepository

settings = get_settings()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class AuthService:
    """Service for authentication and authorization"""
    
    def __init__(self):
        self.user_repo = UserRepository()
    
    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        """Verify a password against its hash"""
        return pwd_context.verify(plain_password, hashed_password)
    
    def hash_password(self, password: str) -> str:
        """Hash a password"""
        return pwd_context.hash(password)
    
    def create_access_token(self, user_id: UUID, expires_delta: Optional[timedelta] = None) -> str:
        """Create a JWT access token"""
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(hours=settings.jwt_expiration_hours)
        
        to_encode = {
            "sub": str(user_id),
            "exp": expire,
            "type": "access"
        }
        
        return jwt.encode(to_encode, settings.jwt_secret, algorithm=settings.jwt_algorithm)
    
    def create_refresh_token(self, user_id: UUID) -> str:
        """Create a JWT refresh token"""
        expire = datetime.utcnow() + timedelta(days=7)
        
        to_encode = {
            "sub": str(user_id),
            "exp": expire,
            "type": "refresh"
        }
        
        return jwt.encode(to_encode, settings.jwt_secret, algorithm=settings.jwt_algorithm)
    
    def decode_token(self, token: str) -> Optional[dict]:
        """Decode and validate a JWT token"""
        try:
            payload = jwt.decode(
                token, 
                settings.jwt_secret, 
                algorithms=[settings.jwt_algorithm]
            )
            return payload
        except JWTError:
            return None
    
    async def register_user(self, user_data: UserCreate) -> User:
        """Register a new user"""
        # Check if user already exists
        existing_user = await self.user_repo.get_by_email(user_data.email)
        if existing_user:
            raise ValueError("User with this email already exists")
        
        # Create user profile
        profile = UserProfile(
            name=user_data.name,
            company=user_data.company if user_data.role == UserRole.RECRUITER else None
        )
        
        # Create user
        user = User(
            id=uuid4(),
            email=user_data.email,
            password_hash=self.hash_password(user_data.password),
            role=user_data.role,
            profile=profile
        )
        
        # Save to database
        await self.user_repo.create(user)
        
        return user
    
    async def authenticate_user(self, email: str, password: str) -> Optional[User]:
        """Authenticate a user with email and password"""
        user = await self.user_repo.get_by_email(email)
        
        if not user:
            return None
        
        if not self.verify_password(password, user.password_hash):
            return None
        
        return user
    
    async def get_user_by_id(self, user_id: str) -> Optional[User]:
        """Get user by ID"""
        return await self.user_repo.get_by_id(user_id)
    
    async def get_current_user(self, token: str) -> Optional[User]:
        """Get current user from JWT token"""
        payload = self.decode_token(token)
        if not payload:
            return None
        
        user_id = payload.get("sub")
        if not user_id:
            return None
        
        return await self.user_repo.get_by_id(user_id)
