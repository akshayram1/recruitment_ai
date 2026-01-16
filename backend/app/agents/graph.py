"""LangGraph orchestration for multi-agent system"""
from typing import Dict, Any, Optional, TypedDict, Annotated, Sequence
from uuid import UUID
import operator
from functools import lru_cache

from langgraph.graph import StateGraph, END
from langgraph.checkpoint.memory import MemorySaver

from app.agents.router_agent import RouterAgent
from app.agents.resume_parser_agent import ResumeParserAgent
from app.agents.job_parser_agent import JobParserAgent
from app.agents.search_agent import SearchAgent
from app.agents.chat_agent import ChatAgent
from app.models.user import UserRole
from app.services.langfuse_service import LangfuseService


class AgentState(TypedDict):
    """State schema for the agent graph"""
    # Input fields
    user_message: str
    user_id: str
    user_role: str
    session_id: Optional[str]
    context_type: Optional[str]
    context_ids: Optional[list]
    file_content: Optional[bytes]
    file_type: Optional[str]
    file_name: Optional[str]
    
    # Routing
    intent: str
    confidence: float
    entities: Dict[str, Any]
    
    # Output fields
    response: Dict[str, Any]
    error: Optional[str]
    
    # Trace
    trace_id: Optional[str]


class AgentGraph:
    """LangGraph orchestration for the recruitment AI agents"""
    
    def __init__(self):
        self.router = RouterAgent()
        self.resume_parser = ResumeParserAgent()
        self.job_parser = JobParserAgent()
        self.search = SearchAgent()
        self.chat = ChatAgent()
        self.langfuse = LangfuseService()
        
        # Build the graph
        self.graph = self._build_graph()
    
    def _build_graph(self) -> StateGraph:
        """Build the LangGraph state machine"""
        
        # Create graph with state schema
        workflow = StateGraph(AgentState)
        
        # Add nodes
        workflow.add_node("route", self._route_node)
        workflow.add_node("parse_resume", self._parse_resume_node)
        workflow.add_node("parse_job", self._parse_job_node)
        workflow.add_node("search", self._search_node)
        workflow.add_node("chat", self._chat_node)
        workflow.add_node("error_handler", self._error_handler_node)
        
        # Set entry point
        workflow.set_entry_point("route")
        
        # Add conditional edges from router
        workflow.add_conditional_edges(
            "route",
            self._get_next_node,
            {
                "parse_resume": "parse_resume",
                "parse_job": "parse_job",
                "search": "search",
                "chat": "chat",
                "error": "error_handler"
            }
        )
        
        # All nodes go to END
        workflow.add_edge("parse_resume", END)
        workflow.add_edge("parse_job", END)
        workflow.add_edge("search", END)
        workflow.add_edge("chat", END)
        workflow.add_edge("error_handler", END)
        
        # Compile with checkpointing
        memory = MemorySaver()
        return workflow.compile(checkpointer=memory)
    
    async def _route_node(self, state: AgentState) -> AgentState:
        """Route the user's request to the appropriate agent"""
        trace_id = self.langfuse.create_trace(
            name="agent_graph",
            user_id=state.get("user_id"),
            session_id=state.get("session_id"),
            metadata={"intent": "routing"}
        )
        state["trace_id"] = trace_id
        
        result = await self.router.classify_intent(
            user_message=state["user_message"],
            user_role=state["user_role"],
            context=state.get("context_type"),
            trace_id=trace_id
        )
        
        state["intent"] = result.get("intent", "general_chat")
        state["confidence"] = result.get("confidence", 0.5)
        state["entities"] = result.get("entities", {})
        
        return state
    
    def _get_next_node(self, state: AgentState) -> str:
        """Determine the next node based on classified intent"""
        intent = state.get("intent", "general_chat")
        
        if state.get("error"):
            return "error"
        
        if intent == "upload_resume":
            return "parse_resume"
        elif intent == "upload_job":
            return "parse_job"
        elif intent in ["search_candidates", "search_jobs"]:
            return "search"
        else:
            return "chat"
    
    async def _parse_resume_node(self, state: AgentState) -> AgentState:
        """Parse a resume document"""
        try:
            file_content = state.get("file_content")
            if not file_content:
                state["error"] = "No file content provided for resume parsing"
                return state
            
            resume = await self.resume_parser.parse_resume(
                resume_text=file_content.decode("utf-8") if isinstance(file_content, bytes) else file_content,
                candidate_id=UUID(state["user_id"]),
                file_name=state.get("file_name"),
                trace_id=state.get("trace_id")
            )
            
            state["response"] = {
                "message": f"Successfully parsed your resume, {resume.parsed_data.name or 'candidate'}!",
                "ui_components": [
                    {
                        "type": "ResumeViewer",
                        "props": resume.parsed_data.model_dump()
                    }
                ],
                "actions": [
                    {
                        "type": "button",
                        "label": "Find Matching Jobs",
                        "action": "search_jobs",
                        "params": {"resume_id": str(resume.id)}
                    }
                ]
            }
            
        except Exception as e:
            state["error"] = str(e)
        
        return state
    
    async def _parse_job_node(self, state: AgentState) -> AgentState:
        """Parse a job description"""
        try:
            file_content = state.get("file_content")
            if not file_content:
                state["error"] = "No file content provided for job parsing"
                return state
            
            job = await self.job_parser.parse_job(
                job_text=file_content.decode("utf-8") if isinstance(file_content, bytes) else file_content,
                recruiter_id=UUID(state["user_id"]),
                file_name=state.get("file_name"),
                trace_id=state.get("trace_id")
            )
            
            state["response"] = {
                "message": f"Successfully parsed job: {job.parsed_data.title or 'position'}",
                "ui_components": [
                    {
                        "type": "JobCard",
                        "props": job.parsed_data.model_dump()
                    }
                ],
                "actions": [
                    {
                        "type": "button",
                        "label": "Find Matching Candidates",
                        "action": "search_candidates",
                        "params": {"job_id": str(job.id)}
                    }
                ]
            }
            
        except Exception as e:
            state["error"] = str(e)
        
        return state
    
    async def _search_node(self, state: AgentState) -> AgentState:
        """Perform semantic search"""
        try:
            intent = state.get("intent")
            query = state.get("user_message")
            
            if intent == "search_candidates":
                results = await self.search.search_candidates(
                    query=query,
                    trace_id=state.get("trace_id")
                )
                
                state["response"] = {
                    "message": f"Found {len(results)} matching candidates",
                    "ui_components": [
                        {
                            "type": "RankedList",
                            "props": {
                                "title": "Matching Candidates",
                                "items": [r.model_dump() for r in results]
                            }
                        }
                    ],
                    "actions": [
                        {
                            "type": "button",
                            "label": "Chat with Selected",
                            "action": "chat_with_candidates",
                            "params": {}
                        }
                    ]
                }
            else:
                results = await self.search.search_jobs(
                    query=query,
                    trace_id=state.get("trace_id")
                )
                
                state["response"] = {
                    "message": f"Found {len(results)} matching jobs",
                    "ui_components": [
                        {
                            "type": "RankedList",
                            "props": {
                                "title": "Matching Jobs",
                                "items": [r.model_dump() for r in results]
                            }
                        }
                    ],
                    "actions": []
                }
                
        except Exception as e:
            state["error"] = str(e)
        
        return state
    
    async def _chat_node(self, state: AgentState) -> AgentState:
        """Handle conversational chat"""
        try:
            response = await self.chat.chat(
                user_message=state["user_message"],
                user_id=UUID(state["user_id"]),
                user_role=UserRole(state["user_role"]),
                session_id=UUID(state["session_id"]) if state.get("session_id") else None,
                context_type=state.get("context_type"),
                context_ids=[UUID(cid) for cid in state.get("context_ids", [])] if state.get("context_ids") else None,
                trace_id=state.get("trace_id")
            )
            
            state["response"] = response
            
        except Exception as e:
            state["error"] = str(e)
        
        return state
    
    async def _error_handler_node(self, state: AgentState) -> AgentState:
        """Handle errors gracefully"""
        error = state.get("error", "An unknown error occurred")
        
        state["response"] = {
            "message": f"I encountered an issue: {error}. Please try again or rephrase your request.",
            "ui_components": [],
            "actions": []
        }
        
        return state
    
    async def run(
        self,
        user_message: str,
        user_id: str,
        user_role: str,
        session_id: Optional[str] = None,
        context_type: Optional[str] = None,
        context_ids: Optional[list] = None,
        file_content: Optional[bytes] = None,
        file_type: Optional[str] = None,
        file_name: Optional[str] = None
    ) -> Dict[str, Any]:
        """Run the agent graph with the given input"""
        
        initial_state: AgentState = {
            "user_message": user_message,
            "user_id": user_id,
            "user_role": user_role,
            "session_id": session_id,
            "context_type": context_type,
            "context_ids": context_ids,
            "file_content": file_content,
            "file_type": file_type,
            "file_name": file_name,
            "intent": "",
            "confidence": 0.0,
            "entities": {},
            "response": {},
            "error": None,
            "trace_id": None
        }
        
        config = {"configurable": {"thread_id": session_id or user_id}}
        
        result = await self.graph.ainvoke(initial_state, config)
        
        # Flush langfuse
        self.langfuse.flush()
        
        return result.get("response", {"message": "No response generated", "ui_components": [], "actions": []})


# Singleton instance - cached to avoid reinitializing agents on every request
_agent_graph_instance: Optional[AgentGraph] = None


def get_agent_graph() -> AgentGraph:
    """Get cached singleton instance of AgentGraph for better performance"""
    global _agent_graph_instance
    if _agent_graph_instance is None:
        _agent_graph_instance = AgentGraph()
    return _agent_graph_instance
