"""Authentication endpoints"""
from datetime import timedelta
from fastapi import APIRouter, HTTPException, status, Depends

from app.schemas.requests import RegisterRequest, LoginRequest
from app.schemas.responses import TokenResponse, UserProfileResponse, UserResponse
from app.services.auth_service import AuthService
from app.models.user import UserRole, UserCreate
from app.api.dependencies import get_current_user
from app.config import get_settings

router = APIRouter()
auth_service = AuthService()
settings = get_settings()


@router.post("/register/candidate", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register_candidate(request: RegisterRequest):
    """Register a new candidate"""
    try:
        user_create = UserCreate(
            email=request.email,
            password=request.password,
            name=request.name,
            role=UserRole.CANDIDATE
        )
        
        user = await auth_service.register_user(user_create)
        
        access_token = auth_service.create_access_token(user.id)
        refresh_token = auth_service.create_refresh_token(user.id)
        
        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            expires_in=settings.jwt_expiration_hours * 3600,
            user=UserResponse(
                id=str(user.id),
                email=user.email,
                name=user.profile.name,
                role=user.role.value,
                company=user.profile.company
            )
        )
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.post("/register/recruiter", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register_recruiter(request: RegisterRequest):
    """Register a new recruiter"""
    if not request.company:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Company name is required for recruiters"
        )
    
    try:
        user_create = UserCreate(
            email=request.email,
            password=request.password,
            name=request.name,
            role=UserRole.RECRUITER,
            company=request.company
        )
        
        user = await auth_service.register_user(user_create)
        
        access_token = auth_service.create_access_token(user.id)
        refresh_token = auth_service.create_refresh_token(user.id)
        
        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            expires_in=settings.jwt_expiration_hours * 3600,
            user=UserResponse(
                id=str(user.id),
                email=user.email,
                name=user.profile.name,
                role=user.role.value,
                company=user.profile.company
            )
        )
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/login", response_model=TokenResponse)
async def login(request: LoginRequest):
    """Login with email and password"""
    user = await auth_service.authenticate_user(request.email, request.password)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    access_token = auth_service.create_access_token(user.id)
    refresh_token = auth_service.create_refresh_token(user.id)
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=settings.jwt_expiration_hours * 3600,
        user=UserResponse(
            id=str(user.id),
            email=user.email,
            name=user.profile.name,
            role=user.role.value,
            company=user.profile.company
        )
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(refresh_token: str):
    """Refresh access token using refresh token"""
    payload = auth_service.decode_token(refresh_token)
    
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )
    
    user_id = payload.get("sub")
    user = await auth_service.get_user_by_id(user_id)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    
    new_access_token = auth_service.create_access_token(user.id)
    new_refresh_token = auth_service.create_refresh_token(user.id)
    
    return TokenResponse(
        access_token=new_access_token,
        refresh_token=new_refresh_token,
        expires_in=settings.jwt_expiration_hours * 3600
    )


@router.get("/me", response_model=UserProfileResponse)
async def get_current_user_profile(current_user = Depends(get_current_user)):
    """Get current user profile"""
    return UserProfileResponse(
        id=current_user.id,
        email=current_user.email,
        name=current_user.profile.name,
        role=current_user.role.value,
        company=current_user.profile.company,
        avatar_url=current_user.profile.avatar_url,
        created_at=current_user.created_at
    )
