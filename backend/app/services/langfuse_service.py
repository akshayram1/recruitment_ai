"""Langfuse observability service"""
from typing import Optional, Dict, Any
import uuid

from app.config import get_settings


class LangfuseService:
    """Service for Langfuse tracing and observability - gracefully handles failures"""
    
    _instance = None
    _spans: Dict[str, Any] = {}  # Store active spans by trace_id
    _initialized: bool = False
    
    def __init__(self):
        self.client = None
        self.enabled = False
        
        if LangfuseService._initialized:
            self.client = LangfuseService._instance
            self.enabled = self.client is not None
            return
            
        try:
            settings = get_settings()
            if settings.langfuse_public_key and settings.langfuse_secret_key:
                from langfuse import Langfuse
                LangfuseService._instance = Langfuse(
                    public_key=settings.langfuse_public_key,
                    secret_key=settings.langfuse_secret_key,
                    host=settings.langfuse_host
                )
                self.client = LangfuseService._instance
                self.enabled = True
                print("Langfuse initialized successfully")
            else:
                print("Warning: Langfuse keys not configured, tracing disabled")
        except Exception as e:
            print(f"Warning: Failed to initialize Langfuse: {e}")
            self.client = None
            self.enabled = False
        finally:
            LangfuseService._initialized = True
    
    def create_trace(
        self,
        name: str,
        user_id: Optional[str] = None,
        session_id: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
        tags: Optional[list] = None
    ) -> str:
        """Create a new trace and return its ID"""
        trace_id = str(uuid.uuid4())
        
        if not self.enabled or not self.client:
            return trace_id
        
        try:
            # Use start_span as the root span for the trace
            span = self.client.start_span(
                name=name,
                input=metadata or {},
            )
            # Update trace metadata
            if span:
                span.update_trace(
                    name=name,
                    user_id=user_id,
                    session_id=session_id,
                    tags=tags or []
                )
                # Use the actual trace_id from the span
                actual_trace_id = span.trace_id or trace_id
                self._spans[actual_trace_id] = span
                return actual_trace_id
        except Exception as e:
            print(f"Warning: Failed to create trace: {e}")
        
        return trace_id
    
    def start_span(
        self,
        trace_id: str,
        name: str,
        input: Optional[Any] = None,
        metadata: Optional[Dict[str, Any]] = None
    ):
        """Start a span within a trace"""
        if not self.enabled or not self.client:
            return None
            
        try:
            parent_span = self._spans.get(trace_id)
            if parent_span:
                span = parent_span.start_span(name=name, input=input, metadata=metadata or {})
            else:
                span = self.client.start_span(name=name, input=input, metadata=metadata or {})
            return span
        except Exception as e:
            print(f"Warning: Failed to start span: {e}")
            return None
    
    def end_span(
        self,
        span,
        output: Optional[Any] = None,
        error: Optional[str] = None
    ):
        """End a span"""
        if not span:
            return
            
        try:
            if error:
                span.update(output=output, level="ERROR", status_message=error)
            else:
                span.update(output=output)
            span.end()
        except Exception as e:
            print(f"Warning: Failed to end span: {e}")
    
    def start_generation(
        self,
        trace_id: str,
        name: str,
        model: str,
        input: Optional[Any] = None,
        metadata: Optional[Dict[str, Any]] = None
    ):
        """Start a generation (LLM call) within a trace"""
        if not self.enabled or not self.client:
            return None
            
        try:
            parent_span = self._spans.get(trace_id)
            if parent_span:
                generation = parent_span.start_generation(
                    name=name,
                    model=model,
                    input=input,
                    metadata=metadata or {}
                )
            else:
                # Create a standalone span with generation
                span = self.client.start_span(name=f"{name}_wrapper")
                generation = span.start_generation(
                    name=name,
                    model=model,
                    input=input,
                    metadata=metadata or {}
                )
            return generation
        except Exception as e:
            print(f"Warning: Failed to start generation: {e}")
            return None
    
    def end_generation(
        self,
        generation,
        output: Optional[Any] = None,
        usage: Optional[Dict[str, int]] = None,
        error: Optional[str] = None
    ):
        """End a generation"""
        if not generation:
            return
            
        try:
            if error:
                generation.update(
                    output=output,
                    level="ERROR",
                    status_message=error
                )
            else:
                if usage:
                    generation.update(
                        output=output,
                        usage_details=usage
                    )
                else:
                    generation.update(output=output)
            generation.end()
        except Exception as e:
            print(f"Warning: Failed to end generation: {e}")
    
    def log_event(
        self,
        trace_id: str,
        name: str,
        input: Optional[Any] = None,
        output: Optional[Any] = None,
        metadata: Optional[Dict[str, Any]] = None
    ):
        """Log an event within a trace"""
        if not self.enabled or not self.client:
            return
            
        try:
            parent_span = self._spans.get(trace_id)
            if parent_span:
                # Create a quick span for the event
                span = parent_span.start_span(
                    name=name,
                    input=input,
                    metadata=metadata or {}
                )
                span.update(output=output)
                span.end()
        except Exception as e:
            print(f"Warning: Failed to log event: {e}")
    
    def score(
        self,
        trace_id: str,
        name: str,
        value: float,
        comment: Optional[str] = None
    ):
        """Add a score to a trace"""
        if not self.enabled:
            return
            
        try:
            parent_span = self._spans.get(trace_id)
            if parent_span:
                parent_span.score_trace(
                    name=name,
                    value=value,
                    comment=comment
                )
        except Exception as e:
            print(f"Warning: Failed to score: {e}")
    
    def end_trace(self, trace_id: str):
        """End a trace"""
        try:
            parent_span = self._spans.get(trace_id)
            if parent_span:
                parent_span.end()
                del self._spans[trace_id]
        except Exception as e:
            print(f"Warning: Failed to end trace: {e}")
    
    def flush(self):
        """Flush all pending events"""
        if self.client:
            try:
                self.client.flush()
            except Exception as e:
                print(f"Warning: Failed to flush: {e}")


# Decorator for automatic tracing
def traced(name: str = None):
    """Decorator for automatic function tracing"""
    return observe(name=name)
