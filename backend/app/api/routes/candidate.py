"""Candidate endpoints"""
from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, HTTPException, status, Depends, UploadFile, File, Form

from app.api.dependencies import get_current_candidate
from app.schemas.responses import ResumeResponse, JobMatchResponse, ChatMessageResponse
from app.schemas.requests import ChatMessageRequest
from app.services.document_service import DocumentService
from app.agents.resume_parser_agent import ResumeParserAgent
from app.agents.search_agent import SearchAgent
from app.agents.graph import get_agent_graph
from app.db.repositories import ResumeRepository
from app.services.langfuse_service import LangfuseService

router = APIRouter()
document_service = DocumentService()
resume_parser = ResumeParserAgent()
search_agent = SearchAgent()
resume_repo = ResumeRepository()
langfuse = LangfuseService()


@router.post("/resume/upload", response_model=ResumeResponse, status_code=status.HTTP_201_CREATED)
async def upload_resume(
    file: UploadFile = File(...),
    current_user = Depends(get_current_candidate)
):
    """Upload and parse a resume (PDF or DOCX)"""
    # Validate file type
    allowed_types = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF and DOCX files are supported"
        )
    
    try:
        # Read file content
        file_content = await file.read()
        
        # Create trace
        trace_id = langfuse.create_trace(
            name="resume_upload",
            user_id=str(current_user.id),
            metadata={"file_name": file.filename, "file_type": file.content_type}
        )
        
        # Parse document
        raw_text = await document_service.parse_document(file_content, file.content_type)
        
        # Parse resume with agent
        resume = await resume_parser.parse_resume(
            resume_text=raw_text,
            candidate_id=current_user.id,
            file_name=file.filename,
            trace_id=trace_id
        )
        
        langfuse.flush()
        
        return ResumeResponse(
            id=resume.id,
            candidate_id=resume.candidate_id,
            parsed_data=resume.parsed_data.model_dump(),
            file_name=resume.file_name,
            created_at=resume.created_at,
            updated_at=resume.updated_at
        )
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process resume: {str(e)}"
        )


@router.post("/resume/upload-text", response_model=ResumeResponse, status_code=status.HTTP_201_CREATED)
async def upload_resume_text(
    content: str = Form(...),
    file_name: Optional[str] = Form(None),
    current_user = Depends(get_current_candidate)
):
    """Upload resume as raw text"""
    try:
        trace_id = langfuse.create_trace(
            name="resume_upload_text",
            user_id=str(current_user.id)
        )
        
        resume = await resume_parser.parse_resume(
            resume_text=content,
            candidate_id=current_user.id,
            file_name=file_name,
            trace_id=trace_id
        )
        
        langfuse.flush()
        
        return ResumeResponse(
            id=resume.id,
            candidate_id=resume.candidate_id,
            parsed_data=resume.parsed_data.model_dump(),
            file_name=resume.file_name,
            created_at=resume.created_at,
            updated_at=resume.updated_at
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process resume: {str(e)}"
        )


@router.get("/resume", response_model=ResumeResponse)
async def get_resume(current_user = Depends(get_current_candidate)):
    """Get the current candidate's resume"""
    resume = await resume_repo.get_by_candidate_id(str(current_user.id))
    
    if not resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume not found. Please upload your resume first."
        )
    
    return ResumeResponse(
        id=resume.id,
        candidate_id=resume.candidate_id,
        parsed_data=resume.parsed_data.model_dump(),
        file_name=resume.file_name,
        created_at=resume.created_at,
        updated_at=resume.updated_at
    )


@router.get("/jobs/matches", response_model=List[JobMatchResponse])
async def get_job_matches(
    limit: int = 10,
    current_user = Depends(get_current_candidate)
):
    """Get jobs matching the candidate's resume"""
    # Get candidate's resume
    resume = await resume_repo.get_by_candidate_id(str(current_user.id))
    
    if not resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume not found. Please upload your resume first."
        )
    
    try:
        trace_id = langfuse.create_trace(
            name="job_search",
            user_id=str(current_user.id)
        )
        
        matches = await search_agent.search_jobs(
            resume_id=resume.id,
            limit=limit,
            trace_id=trace_id
        )
        
        langfuse.flush()
        
        return [
            JobMatchResponse(
                id=match.id,
                title=match.title,
                company=match.company,
                match_score=match.match_score,
                location=match.location,
                required_skills=match.required_skills,
                explanation=match.explanation
            )
            for match in matches
        ]
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to search jobs: {str(e)}"
        )


@router.post("/chat", response_model=ChatMessageResponse)
async def candidate_chat(
    request: ChatMessageRequest,
    current_user = Depends(get_current_candidate)
):
    """Chat endpoint for candidates"""
    try:
        graph = get_agent_graph()
        
        response = await graph.run(
            user_message=request.message,
            user_id=str(current_user.id),
            user_role="candidate",
            session_id=str(request.session_id) if request.session_id else None,
            context_type=request.context_type,
            context_ids=[str(cid) for cid in request.context_ids] if request.context_ids else None
        )
        
        return ChatMessageResponse(
            message=response.get("message", ""),
            session_id=response.get("session_id", request.session_id or UUID("00000000-0000-0000-0000-000000000000")),
            ui_components=response.get("ui_components", []),
            actions=response.get("actions", [])
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Chat error: {str(e)}"
        )
