"""C1 API compatible endpoint for Thesys Generative UI"""
from fastapi import APIRouter, Request, HTTPException, status
from fastapi.responses import StreamingResponse
from openai import OpenAI
import json
import os

from app.config import get_settings
from app.services.auth_service import AuthService

router = APIRouter()
auth_service = AuthService()
settings = get_settings()

# C1 compatible endpoint that proxies to Thesys API
THESYS_BASE_URL = "https://api.thesys.dev/v1/embed"
# Default Thesys C1 model (Claude Sonnet via Thesys)
DEFAULT_C1_MODEL = "c1/anthropic/claude-sonnet-4/v-20250815"


@router.post("/completions")
async def c1_chat_completions(request: Request):
    """
    OpenAI-compatible chat completions endpoint that routes through Thesys C1 API.
    This enables generative UI responses instead of plain text.
    """
    # Get token from query params or header
    token = request.query_params.get("token")
    if not token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
    
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required"
        )
    
    # Verify token
    try:
        user = await auth_service.get_current_user(token)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )
    
    # Get request body
    body = await request.json()
    
    # Get role from query params
    role = request.query_params.get("role", "candidate")
    
    # Get messages from body
    messages = body.get("messages", [])
    
    # Get context based on role
    context_info = ""
    if role == "candidate":
        from app.db.repositories import ResumeRepository
        resume_repo = ResumeRepository()
        resume = await resume_repo.get_by_candidate_id(str(user.id))
        if resume:
            context_info = f"\n\nUser's Resume Summary:\n- Name: {resume.parsed_data.name}\n- Skills: {', '.join(resume.parsed_data.skills[:10]) if resume.parsed_data.skills else 'Not specified'}\n- Experience: {len(resume.parsed_data.experience)} positions"
            if resume.parsed_data.summary:
                context_info += f"\n- Summary: {resume.parsed_data.summary}"
            if resume.parsed_data.experience:
                recent_exp = resume.parsed_data.experience[0]
                context_info += f"\n- Current/Recent Role: {recent_exp.title} at {recent_exp.company}"
        
        # Check if candidate is asking for jobs
        user_message = messages[-1].get("content", "") if messages else ""
        job_keywords = ["job", "jobs", "position", "positions", "opportunity", "opportunities", "career", "work", "opening", "openings", "best", "find", "search", "show", "available", "looking"]
        if any(keyword in user_message.lower() for keyword in job_keywords):
            # Fetch actual jobs from database
            from app.agents.search_agent import SearchAgent
            search_agent = SearchAgent()
            try:
                # Debug: Check Qdrant collection
                from app.services.qdrant_service import QdrantService
                qdrant = QdrantService()
                try:
                    collection_info = qdrant.client.get_collection(collection_name="jobs")
                    print(f"Qdrant jobs collection has {collection_info.points_count} points")
                except Exception as e:
                    print(f"Jobs collection error: {e}")
                
                jobs = await search_agent.search_jobs(
                    query=user_message,
                    limit=10
                )
                print(f"Found {len(jobs)} jobs")
                if jobs:
                    context_info += "\n\nAvailable Jobs in Database:"
                    for i, job in enumerate(jobs[:5], 1):
                        context_info += f"\n\n{i}. {job.title}"
                        context_info += f"\n   - Company: {job.company}"
                        context_info += f"\n   - Match Score: {job.match_score:.1%}"
                        if job.location:
                            context_info += f"\n   - Location: {job.location}"
                        if job.salary_range:
                            context_info += f"\n   - Salary: {job.salary_range}"
                        if job.required_skills:
                            context_info += f"\n   - Required Skills: {', '.join(job.required_skills[:5])}"
                    context_info += f"\n\nTotal jobs found: {len(jobs)}"
                    context_info += "\n\nIMPORTANT: Use ONLY the job information provided above. Do NOT invent or make up any jobs."
                else:
                    context_info += "\n\nNo jobs found in the database. Please inform the candidate that no job openings are currently available and suggest they check back later."
            except Exception as e:
                print(f"Error fetching jobs: {e}")
                import traceback
                traceback.print_exc()
                context_info += "\n\nUnable to fetch jobs at this time. Please try again."
    
    elif role == "recruiter":
        # Check if recruiter is asking for candidates
        user_message = messages[-1].get("content", "") if messages else ""
        search_keywords = ["candidate", "find", "search", "show", "best", "available", "looking for", "need"]
        if any(keyword in user_message.lower() for keyword in search_keywords):
            # Fetch actual candidates from database
            from app.agents.search_agent import SearchAgent
            search_agent = SearchAgent()
            try:
                # Debug: Check Qdrant collection
                from app.services.qdrant_service import QdrantService
                qdrant = QdrantService()
                collection_info = qdrant.client.get_collection(collection_name="resumes")
                print(f"Qdrant resumes collection has {collection_info.points_count} points")
                
                candidates = await search_agent.search_candidates(
                    query=user_message,
                    limit=10
                )
                print(f"Found {len(candidates)} candidates")
                if candidates:
                    context_info = "\n\nAvailable Candidates in Database:"
                    for i, candidate in enumerate(candidates[:5], 1):
                        context_info += f"\n\n{i}. {candidate.name}"
                        context_info += f"\n   - Match Score: {candidate.match_score:.1%}"
                        context_info += f"\n   - Skills: {', '.join(candidate.skills[:8]) if candidate.skills else 'Not specified'}"
                        if candidate.current_role:
                            context_info += f"\n   - Current Role: {candidate.current_role}"
                        if candidate.experience_years:
                            context_info += f"\n   - Experience: {candidate.experience_years} years"
                    context_info += f"\n\nTotal candidates found: {len(candidates)}"
                    context_info += "\n\nIMPORTANT: Use ONLY the candidate information provided above. Do NOT invent or make up any candidates."
                else:
                    context_info = "\n\nNo candidates found in the database. Please inform the recruiter that no candidates are currently available and suggest they check back later or adjust their search criteria."
            except Exception as e:
                print(f"Error fetching candidates: {e}")
                context_info = "\n\nUnable to fetch candidates at this time. Please try again."
    
    # Add system message based on role
    system_message = get_system_message(role, user, context_info)
    
    if not any(m.get("role") == "system" for m in messages):
        messages.insert(0, {"role": "system", "content": system_message})
    
    # Create Thesys client
    client = OpenAI(
        api_key=settings.thesys_api_key,
        base_url=THESYS_BASE_URL
    )
    
    # Use the C1 model that supports generative UI
    model = body.get("model", DEFAULT_C1_MODEL)
    
    try:
        # Make request to Thesys C1 API
        response = client.chat.completions.create(
            model=model,
            messages=messages,
            stream=body.get("stream", True),
            temperature=body.get("temperature", 0.7),
        )
        
        if body.get("stream", True):
            # Stream the response
            def generate():
                for chunk in response:
                    if chunk.choices and chunk.choices[0].delta.content:
                        data = {
                            "choices": [{
                                "delta": {
                                    "content": chunk.choices[0].delta.content
                                }
                            }]
                        }
                        yield f"data: {json.dumps(data)}\n\n"
                yield "data: [DONE]\n\n"
            
            return StreamingResponse(
                generate(),
                media_type="text/event-stream",
                headers={
                    "Cache-Control": "no-cache",
                    "Connection": "keep-alive",
                }
            )
        else:
            return response.model_dump()
            
    except Exception as e:
        import traceback
        print(f"C1 API error: {str(e)}")
        print(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"C1 API error: {str(e)}"
        )


def get_system_message(role: str, user, context: str = "") -> str:
    """Get role-specific system message for the AI"""
    user_name = user.profile.name if user.profile else "there"
    
    if role == "candidate":
        base_message = f"""You are an AI Career Assistant helping {user_name} find jobs and improve their career.

Your capabilities:
- Search for jobs matching the candidate's skills and experience
- Analyze their resume and provide feedback
- Suggest skills to learn based on market demand
- Provide career advice and interview tips

When showing job results, use interactive UI components like cards, lists, and charts.
Be helpful, encouraging, and provide actionable advice.
Focus on the candidate's strengths while suggesting areas for improvement."""
        
        if context:
            base_message += f"\n{context}"
        
        return base_message

    else:  # recruiter
        company = user.profile.company if user.profile and user.profile.company else "their company"
        base_message = f"""You are an AI Recruitment Assistant helping {user_name} from {company} find the best candidates.

You have access to a real candidate database. When showing candidates, use ONLY the actual candidate data provided in the context.

Your responsibilities:
- Present candidates from the database accurately
- Analyze and compare real candidate profiles
- Provide insights based on actual candidate data
- Help evaluate candidates objectively

CRITICAL RULES:
1. ONLY use candidate information provided in the context
2. DO NOT invent, hallucinate, or make up any candidates
3. If no candidates are available, clearly state this fact
4. When candidates are provided, present them with their actual skills, experience, and details

When showing candidate results, use interactive UI components like cards, ranked lists, and match summaries.
Be objective and data-driven in your assessments.
Highlight both matching skills and potential gaps for each candidate."""
        
        if context:
            base_message += f"\n{context}"
        
        return base_message
