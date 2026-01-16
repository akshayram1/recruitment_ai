"""Recruiter endpoints"""
from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, HTTPException, status, Depends, UploadFile, File, Form

from app.api.dependencies import get_current_recruiter
from app.schemas.responses import JobResponse, CandidateMatchResponse, ChatMessageResponse
from app.schemas.requests import ChatMessageRequest, SearchQueryRequest
from app.services.document_service import DocumentService
from app.agents.job_parser_agent import JobParserAgent
from app.agents.search_agent import SearchAgent
from app.agents.graph import get_agent_graph
from app.db.repositories import JobRepository
from app.services.langfuse_service import LangfuseService

router = APIRouter()
document_service = DocumentService()
job_parser = JobParserAgent()
search_agent = SearchAgent()
job_repo = JobRepository()
langfuse = LangfuseService()


@router.post("/job/upload", response_model=JobResponse, status_code=status.HTTP_201_CREATED)
async def upload_job(
    file: UploadFile = File(...),
    current_user = Depends(get_current_recruiter)
):
    """Upload and parse a job description (PDF or DOCX)"""
    allowed_types = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF and DOCX files are supported"
        )
    
    try:
        file_content = await file.read()
        
        trace_id = langfuse.create_trace(
            name="job_upload",
            user_id=str(current_user.id),
            metadata={"file_name": file.filename}
        )
        
        raw_text = await document_service.parse_document(file_content, file.content_type)
        
        job = await job_parser.parse_job(
            job_text=raw_text,
            recruiter_id=current_user.id,
            file_name=file.filename,
            trace_id=trace_id
        )
        
        langfuse.flush()
        
        return JobResponse(
            id=job.id,
            recruiter_id=job.recruiter_id,
            parsed_data=job.parsed_data.model_dump(),
            file_name=job.file_name,
            created_at=job.created_at,
            updated_at=job.updated_at
        )
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process job description: {str(e)}"
        )


@router.post("/job/upload-text", response_model=JobResponse, status_code=status.HTTP_201_CREATED)
async def upload_job_text(
    content: str = Form(...),
    file_name: Optional[str] = Form(None),
    current_user = Depends(get_current_recruiter)
):
    """Upload job description as raw text"""
    try:
        trace_id = langfuse.create_trace(
            name="job_upload_text",
            user_id=str(current_user.id)
        )
        
        job = await job_parser.parse_job(
            job_text=content,
            recruiter_id=current_user.id,
            file_name=file_name,
            trace_id=trace_id
        )
        
        langfuse.flush()
        
        return JobResponse(
            id=job.id,
            recruiter_id=job.recruiter_id,
            parsed_data=job.parsed_data.model_dump(),
            file_name=job.file_name,
            created_at=job.created_at,
            updated_at=job.updated_at
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process job description: {str(e)}"
        )


@router.get("/jobs", response_model=List[JobResponse])
async def get_jobs(current_user = Depends(get_current_recruiter)):
    """Get all jobs for the current recruiter"""
    jobs = await job_repo.get_by_recruiter_id(str(current_user.id))
    
    return [
        JobResponse(
            id=job.id,
            recruiter_id=job.recruiter_id,
            parsed_data=job.parsed_data.model_dump(),
            file_name=job.file_name,
            created_at=job.created_at,
            updated_at=job.updated_at
        )
        for job in jobs
    ]


@router.get("/job/{job_id}", response_model=JobResponse)
async def get_job(
    job_id: UUID,
    current_user = Depends(get_current_recruiter)
):
    """Get a specific job"""
    job = await job_repo.get_by_id(str(job_id))
    
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found"
        )
    
    if job.recruiter_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    return JobResponse(
        id=job.id,
        recruiter_id=job.recruiter_id,
        parsed_data=job.parsed_data.model_dump(),
        file_name=job.file_name,
        created_at=job.created_at,
        updated_at=job.updated_at
    )


@router.delete("/job/{job_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_job(
    job_id: UUID,
    current_user = Depends(get_current_recruiter)
):
    """Delete a job"""
    job = await job_repo.get_by_id(str(job_id))
    
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found"
        )
    
    if job.recruiter_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    await job_repo.delete(str(job_id))


@router.get("/candidates/search", response_model=List[CandidateMatchResponse])
async def search_candidates(
    query: Optional[str] = None,
    job_id: Optional[UUID] = None,
    limit: int = 10,
    current_user = Depends(get_current_recruiter)
):
    """Search for candidates"""
    if not query and not job_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Either query or job_id is required"
        )
    
    try:
        trace_id = langfuse.create_trace(
            name="candidate_search",
            user_id=str(current_user.id),
            metadata={"query": query, "job_id": str(job_id) if job_id else None}
        )
        
        matches = await search_agent.search_candidates(
            query=query,
            job_id=job_id,
            limit=limit,
            trace_id=trace_id
        )
        
        langfuse.flush()
        
        return [
            CandidateMatchResponse(
                id=match.id,
                name=match.name,
                match_score=match.match_score,
                skills=match.skills,
                experience_years=match.experience_years,
                current_role=match.current_role,
                explanation=match.explanation
            )
            for match in matches
        ]
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to search candidates: {str(e)}"
        )


@router.post("/chat", response_model=ChatMessageResponse)
async def recruiter_chat(
    request: ChatMessageRequest,
    current_user = Depends(get_current_recruiter)
):
    """Chat endpoint for recruiters"""
    try:
        graph = get_agent_graph()
        
        response = await graph.run(
            user_message=request.message,
            user_id=str(current_user.id),
            user_role="recruiter",
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
