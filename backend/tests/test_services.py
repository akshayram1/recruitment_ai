"""Tests for services"""
import pytest
from unittest.mock import AsyncMock, MagicMock, patch

from app.services.document_service import DocumentService
from app.services.auth_service import AuthService


class TestDocumentService:
    def test_chunk_text_short(self):
        service = DocumentService()
        text = "This is a short text."
        chunks = service.chunk_text(text)
        assert len(chunks) == 1
        assert chunks[0] == text
    
    def test_chunk_text_long(self):
        service = DocumentService()
        service.chunk_size = 100
        service.chunk_overlap = 20
        
        text = "A" * 250
        chunks = service.chunk_text(text)
        
        assert len(chunks) > 1


class TestAuthService:
    def test_hash_password(self):
        service = AuthService()
        password = "testpassword123"
        hashed = service.hash_password(password)
        
        assert hashed != password
        assert service.verify_password(password, hashed)
    
    def test_verify_password_wrong(self):
        service = AuthService()
        password = "testpassword123"
        hashed = service.hash_password(password)
        
        assert not service.verify_password("wrongpassword", hashed)
    
    @patch("app.services.auth_service.get_settings")
    def test_create_access_token(self, mock_settings):
        mock_settings.return_value.jwt_secret = "test-secret"
        mock_settings.return_value.jwt_algorithm = "HS256"
        mock_settings.return_value.jwt_expiration_hours = 24
        
        from uuid import uuid4
        service = AuthService()
        user_id = uuid4()
        
        token = service.create_access_token(user_id)
        
        assert token is not None
        assert len(token) > 0
    
    @patch("app.services.auth_service.get_settings")
    def test_decode_token_invalid(self, mock_settings):
        mock_settings.return_value.jwt_secret = "test-secret"
        mock_settings.return_value.jwt_algorithm = "HS256"
        
        service = AuthService()
        result = service.decode_token("invalid-token")
        
        assert result is None
