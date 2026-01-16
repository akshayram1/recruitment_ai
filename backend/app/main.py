"""FastAPI entry point"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import asyncio

from app.config import get_settings
from app.api.routes import auth, candidate, recruiter, chat, c1
from app.db.database import init_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    # Startup
    settings = get_settings()
    
    # Initialize database
    await init_db()
    
    # Initialize Qdrant collections in background (non-blocking)
    async def init_qdrant():
        from app.services.qdrant_service import QdrantService
        qdrant_service = QdrantService()
        qdrant_service.initialize_collections()
    
    # Run Qdrant initialization in background
    asyncio.create_task(init_qdrant())
    
    print(f"🚀 {settings.app_name} started successfully!")
    
    yield
    
    # Shutdown
    print("👋 Shutting down...")


app = FastAPI(
    title="AI Recruitment Platform",
    description="AI-powered recruitment platform with semantic search and conversational AI",
    version="0.1.0",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000", 
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(candidate.router, prefix="/api/candidate", tags=["Candidate"])
app.include_router(recruiter.router, prefix="/api/recruiter", tags=["Recruiter"])
app.include_router(chat.router, prefix="/api/chat", tags=["Chat"])
app.include_router(c1.router, prefix="/api/c1", tags=["C1 Generative UI"])


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Welcome to AI Recruitment Platform",
        "docs": "/docs",
        "health": "/health"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}
