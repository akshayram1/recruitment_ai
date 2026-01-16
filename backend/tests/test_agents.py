"""Tests for agents"""
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4

from app.agents.router_agent import RouterAgent
from app.agents.resume_parser_agent import ResumeParserAgent
from app.agents.job_parser_agent import JobParserAgent
from app.agents.search_agent import SearchAgent


@pytest.fixture
def mock_openai_client():
    with patch("app.agents.router_agent.AsyncOpenAI") as mock:
        yield mock


class TestRouterAgent:
    @pytest.mark.asyncio
    async def test_classify_intent_general_chat(self, mock_openai_client):
        # Setup mock
        mock_response = MagicMock()
        mock_response.choices = [MagicMock()]
        mock_response.choices[0].message.content = '{"intent": "general_chat", "confidence": 0.9, "entities": {}}'
        mock_response.usage.prompt_tokens = 100
        mock_response.usage.completion_tokens = 50
        mock_response.usage.total_tokens = 150
        
        mock_client = AsyncMock()
        mock_client.chat.completions.create = AsyncMock(return_value=mock_response)
        mock_openai_client.return_value = mock_client
        
        router = RouterAgent()
        router.client = mock_client
        
        result = await router.classify_intent(
            user_message="Hello, how are you?",
            user_role="candidate"
        )
        
        assert result["intent"] == "general_chat"
        assert result["confidence"] == 0.9
    
    def test_get_handler_for_intent(self):
        router = RouterAgent()
        
        assert router.get_handler_for_intent("upload_resume") == "resume_parser_agent"
        assert router.get_handler_for_intent("search_candidates") == "search_agent"
        assert router.get_handler_for_intent("general_chat") == "chat_agent"
        assert router.get_handler_for_intent("unknown") == "chat_agent"


class TestResumeParserAgent:
    @pytest.mark.asyncio
    async def test_create_embedding_text(self):
        from app.models.resume import ParsedResume, Experience
        
        agent = ResumeParserAgent()
        
        parsed_resume = ParsedResume(
            name="John Doe",
            email="john@example.com",
            skills=["Python", "FastAPI", "React"],
            experience=[
                {"title": "Software Engineer", "company": "TechCorp", "duration": "2020-Present", "description": "Built APIs"}
            ],
            summary="Experienced software engineer"
        )
        
        embedding_text = agent._create_embedding_text(parsed_resume, "raw text")
        
        assert "Summary: Experienced software engineer" in embedding_text
        assert "Skills: Python, FastAPI, React" in embedding_text


class TestSearchAgent:
    def test_calculate_experience_years(self):
        from app.models.resume import Resume, ParsedResume
        
        agent = SearchAgent()
        
        # Test with no resume
        assert agent._calculate_experience_years(None) is None
        
    def test_get_current_role(self):
        agent = SearchAgent()
        
        # Test with no resume
        assert agent._get_current_role(None) is None
