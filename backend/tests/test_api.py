"""Tests for API endpoints"""
import pytest
from httpx import AsyncClient
from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


class TestHealthEndpoints:
    def test_root(self):
        response = client.get("/")
        assert response.status_code == 200
        assert "message" in response.json()
    
    def test_health(self):
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json()["status"] == "healthy"


class TestAuthEndpoints:
    def test_register_candidate_missing_fields(self):
        response = client.post(
            "/api/auth/register/candidate",
            json={"email": "test@example.com"}
        )
        assert response.status_code == 422  # Validation error
    
    def test_register_recruiter_missing_company(self):
        response = client.post(
            "/api/auth/register/recruiter",
            json={
                "email": "recruiter@example.com",
                "password": "password123",
                "name": "Test Recruiter"
            }
        )
        assert response.status_code == 400
        assert "Company name is required" in response.json()["detail"]
    
    def test_login_invalid_credentials(self):
        response = client.post(
            "/api/auth/login",
            json={
                "email": "nonexistent@example.com",
                "password": "wrongpassword"
            }
        )
        assert response.status_code == 401


class TestCandidateEndpoints:
    def test_get_resume_unauthorized(self):
        response = client.get("/api/candidate/resume")
        assert response.status_code == 403  # No token
    
    def test_upload_resume_unauthorized(self):
        response = client.post(
            "/api/candidate/resume/upload",
            files={"file": ("test.pdf", b"fake pdf content", "application/pdf")}
        )
        assert response.status_code == 403


class TestRecruiterEndpoints:
    def test_get_jobs_unauthorized(self):
        response = client.get("/api/recruiter/jobs")
        assert response.status_code == 403
    
    def test_search_candidates_unauthorized(self):
        response = client.get("/api/recruiter/candidates/search?query=python")
        assert response.status_code == 403
