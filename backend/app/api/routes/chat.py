"""Chat endpoints for Thesys integration"""
from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.responses import StreamingResponse
import json
import asyncio

from app.api.dependencies import get_current_user
from app.schemas.requests import ChatMessageRequest
from app.schemas.responses import ChatMessageResponse
from app.agents.graph import get_agent_graph
from app.db.repositories import ChatRepository
from app.services.langfuse_service import LangfuseService

router = APIRouter()
chat_repo = ChatRepository()
langfuse = LangfuseService()


@router.post("/candidate", response_model=ChatMessageResponse)
async def candidate_chat(
    request: ChatMessageRequest,
    current_user = Depends(get_current_user)
):
    """Candidate chat endpoint for Thesys Gen UI"""
    if current_user.role.value != "candidate":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This endpoint is for candidates only"
        )
    
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


@router.post("/recruiter", response_model=ChatMessageResponse)
async def recruiter_chat(
    request: ChatMessageRequest,
    current_user = Depends(get_current_user)
):
    """Recruiter chat endpoint for Thesys Gen UI"""
    if current_user.role.value != "recruiter":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This endpoint is for recruiters only"
        )
    
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


@router.post("/candidate/stream")
async def candidate_chat_stream(
    request: ChatMessageRequest,
    current_user = Depends(get_current_user)
):
    """Streaming chat endpoint for candidates"""
    if current_user.role.value != "candidate":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This endpoint is for candidates only"
        )
    
    async def generate():
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
            
            # Simulate streaming by yielding chunks
            message = response.get("message", "")
            words = message.split(" ")
            
            for i, word in enumerate(words):
                chunk = {
                    "type": "text",
                    "content": word + (" " if i < len(words) - 1 else "")
                }
                yield f"data: {json.dumps(chunk)}\n\n"
                await asyncio.sleep(0.05)  # Simulate typing delay
            
            # Send UI components at the end
            if response.get("ui_components"):
                yield f"data: {json.dumps({'type': 'ui_components', 'content': response['ui_components']})}\n\n"
            
            if response.get("actions"):
                yield f"data: {json.dumps({'type': 'actions', 'content': response['actions']})}\n\n"
            
            yield "data: [DONE]\n\n"
            
        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'content': str(e)})}\n\n"
    
    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive"
        }
    )


@router.post("/recruiter/stream")
async def recruiter_chat_stream(
    request: ChatMessageRequest,
    current_user = Depends(get_current_user)
):
    """Streaming chat endpoint for recruiters"""
    if current_user.role.value != "recruiter":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This endpoint is for recruiters only"
        )
    
    async def generate():
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
            
            message = response.get("message", "")
            words = message.split(" ")
            
            for i, word in enumerate(words):
                chunk = {
                    "type": "text",
                    "content": word + (" " if i < len(words) - 1 else "")
                }
                yield f"data: {json.dumps(chunk)}\n\n"
                await asyncio.sleep(0.05)
            
            if response.get("ui_components"):
                yield f"data: {json.dumps({'type': 'ui_components', 'content': response['ui_components']})}\n\n"
            
            if response.get("actions"):
                yield f"data: {json.dumps({'type': 'actions', 'content': response['actions']})}\n\n"
            
            yield "data: [DONE]\n\n"
            
        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'content': str(e)})}\n\n"
    
    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive"
        }
    )


@router.get("/history/{session_id}")
async def get_chat_history(
    session_id: UUID,
    current_user = Depends(get_current_user)
):
    """Get chat history for a session"""
    session = await chat_repo.get_session(str(session_id))
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat session not found"
        )
    
    if session.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    messages = await chat_repo.get_messages(str(session_id))
    
    return {
        "session_id": session_id,
        "messages": [
            {
                "id": str(msg.id),
                "role": msg.role,
                "content": msg.content,
                "created_at": msg.created_at.isoformat()
            }
            for msg in messages
        ]
    }
