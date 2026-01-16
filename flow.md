# AI Recruitment Platform - Application Flow

## Overview

This document describes the complete application flow for the AI Recruitment Platform, detailing how **Candidates** and **Recruiters** interact with the system and how they differ in their workflows.

---

## 🔐 Authentication Flow (Common)

```
┌─────────────────────────────────────────────────────────────────┐
│                     AUTHENTICATION FLOW                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   User ─────► /register ─────► Choose Role ─────► Create Account │
│                                    │                             │
│                          ┌────────┴────────┐                    │
│                          │                 │                     │
│                     CANDIDATE          RECRUITER                 │
│                    (name, email)    (name, email, company)       │
│                          │                 │                     │
│                          └────────┬────────┘                    │
│                                   │                              │
│                              JWT Token                           │
│                                   │                              │
│                          Role-based Redirect                     │
│                                   │                              │
│                    ┌──────────────┴──────────────┐              │
│                    │                             │               │
│              /candidate                    /recruiter            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### User Roles

| Field       | Candidate | Recruiter |
|-------------|-----------|-----------|
| name        | ✅ Required | ✅ Required |
| email       | ✅ Required | ✅ Required |
| password    | ✅ Required | ✅ Required |
| company     | ❌ Not applicable | ✅ Required |

---

## 👤 CANDIDATE FLOW

### Primary Goal
Help job seekers find matching jobs and prepare for their career journey.

### Candidate Dashboard Features
```
┌─────────────────────────────────────────────────────────────────┐
│                     CANDIDATE DASHBOARD                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐        │
│   │   UPLOAD    │    │   SEARCH    │    │    CHAT     │        │
│   │   RESUME    │    │    JOBS     │    │ ASSISTANT   │        │
│   └──────┬──────┘    └──────┬──────┘    └──────┬──────┘        │
│          │                  │                  │                 │
│          ▼                  ▼                  ▼                 │
│   PDF/DOCX Parser    Semantic Search    Career Advisor          │
│   AI Extraction      Job Matching       Interview Prep          │
│   Skill Detection    Score Ranking      Resume Tips             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 1. Resume Upload Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     RESUME UPLOAD FLOW                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   Candidate ──► Upload PDF/DOCX                                 │
│        │                                                         │
│        ▼                                                         │
│   DocumentService.parse_document()                              │
│        │                                                         │
│        ▼                                                         │
│   ResumeParserAgent.parse_resume()                              │
│        │   ┌────────────────────────────────────┐               │
│        │   │ Extracts:                          │               │
│        │   │  • Personal Info (name, contact)   │               │
│        │   │  • Skills (technical, soft)        │               │
│        │   │  • Work Experience                 │               │
│        │   │  • Education                       │               │
│        │   │  • Certifications                  │               │
│        │   └────────────────────────────────────┘               │
│        ▼                                                         │
│   EmbeddingService.generate_embedding()                         │
│        │                                                         │
│        ▼                                                         │
│   QdrantService.store_resume()                                  │
│        │                                                         │
│        ▼                                                         │
│   Resume stored with vector embedding                           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 2. Job Search Flow (Candidate)

```
┌─────────────────────────────────────────────────────────────────┐
│                  CANDIDATE JOB SEARCH FLOW                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   Candidate ──► "Find jobs matching my skills"                  │
│        │                                                         │
│        ▼                                                         │
│   RouterAgent.classify_intent()                                 │
│        │   Intent: "search_jobs"                                │
│        ▼                                                         │
│   SearchAgent.search_jobs()                                     │
│        │                                                         │
│        ├──► Load candidate's resume                             │
│        │                                                         │
│        ├──► Generate search query from resume                   │
│        │                                                         │
│        ├──► Create embedding for query                          │
│        │                                                         │
│        ├──► QdrantService.search_jobs()                         │
│        │                                                         │
│        ▼                                                         │
│   Return JobMatch[] with:                                       │
│        • Job title & company                                    │
│        • Match score (0-100%)                                   │
│        • Required skills                                        │
│        • Match explanation                                      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 3. Candidate Chat Assistant

```
┌─────────────────────────────────────────────────────────────────┐
│              CANDIDATE CHAT ASSISTANT CAPABILITIES               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   The AI assistant helps candidates with:                       │
│                                                                  │
│   📄 Resume Questions                                           │
│      • "What skills should I highlight?"                        │
│      • "How can I improve my resume?"                           │
│      • "What experience should I emphasize?"                    │
│                                                                  │
│   💼 Career Advice                                              │
│      • "What roles am I qualified for?"                         │
│      • "What skills should I learn next?"                       │
│      • "How do I transition to a new field?"                    │
│                                                                  │
│   🎯 Job Match Analysis                                         │
│      • "Why does this job match my profile?"                    │
│      • "What gaps do I have for this role?"                     │
│      • "How should I tailor my resume for this job?"            │
│                                                                  │
│   🎤 Interview Preparation                                      │
│      • "What questions should I expect?"                        │
│      • "How should I explain my experience?"                    │
│      • "What are my key talking points?"                        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 👔 RECRUITER FLOW

### Primary Goal
Help recruiters find the best candidates for their job openings efficiently.

### Recruiter Dashboard Features
```
┌─────────────────────────────────────────────────────────────────┐
│                     RECRUITER DASHBOARD                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐        │
│   │    POST     │    │   SEARCH    │    │    CHAT     │        │
│   │    JOB      │    │ CANDIDATES  │    │ ASSISTANT   │        │
│   └──────┬──────┘    └──────┬──────┘    └──────┬──────┘        │
│          │                  │                  │                 │
│          ▼                  ▼                  ▼                 │
│   JD Parser Agent    Semantic Search    Candidate Analysis      │
│   Skills Extraction  AI Matching        Interview Questions     │
│   Requirements       Score Ranking      Comparison Reports      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 1. Job Description Upload Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                   JOB DESCRIPTION UPLOAD FLOW                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   Recruiter ──► Upload PDF/DOCX or paste text                   │
│        │                                                         │
│        ▼                                                         │
│   DocumentService.parse_document()                              │
│        │                                                         │
│        ▼                                                         │
│   JobParserAgent.parse_job()                                    │
│        │   ┌────────────────────────────────────┐               │
│        │   │ Extracts:                          │               │
│        │   │  • Job Title                       │               │
│        │   │  • Company Information             │               │
│        │   │  • Required Skills                 │               │
│        │   │  • Preferred Skills                │               │
│        │   │  • Experience Requirements         │               │
│        │   │  • Education Requirements          │               │
│        │   │  • Location & Remote Options       │               │
│        │   │  • Salary Range (if available)     │               │
│        │   └────────────────────────────────────┘               │
│        ▼                                                         │
│   EmbeddingService.generate_embedding()                         │
│        │                                                         │
│        ▼                                                         │
│   QdrantService.store_job()                                     │
│        │                                                         │
│        ▼                                                         │
│   Job stored with vector embedding                              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 2. Candidate Search Flow (Recruiter)

```
┌─────────────────────────────────────────────────────────────────┐
│                 RECRUITER CANDIDATE SEARCH FLOW                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   Recruiter ──► "Find candidates for Senior Python Developer"   │
│        │                                                         │
│        ▼                                                         │
│   RouterAgent.classify_intent()                                 │
│        │   Intent: "search_candidates"                          │
│        ▼                                                         │
│   SearchAgent.search_candidates()                               │
│        │                                                         │
│        ├──► Option A: Search by query text                      │
│        │    "Python, Django, 5 years experience"                │
│        │                                                         │
│        ├──► Option B: Search by job_id                          │
│        │    Auto-generate query from job description            │
│        │                                                         │
│        ├──► Create embedding for query                          │
│        │                                                         │
│        ├──► QdrantService.search_candidates()                   │
│        │                                                         │
│        ▼                                                         │
│   Return CandidateMatch[] with:                                 │
│        • Candidate name                                         │
│        • Match score (0-100%)                                   │
│        • Key skills                                             │
│        • Years of experience                                    │
│        • Current role                                           │
│        • Match explanation                                      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 3. Recruiter Chat Assistant

```
┌─────────────────────────────────────────────────────────────────┐
│              RECRUITER CHAT ASSISTANT CAPABILITIES               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   The AI assistant helps recruiters with:                       │
│                                                                  │
│   🔍 Candidate Search                                           │
│      • "Find me Python developers with 5+ years"                │
│      • "Show candidates with ML experience"                     │
│      • "Who has React and TypeScript skills?"                   │
│                                                                  │
│   📊 Candidate Analysis                                         │
│      • "Analyze this candidate's strengths"                     │
│      • "What are the red flags in this resume?"                 │
│      • "Rate this candidate for the role"                       │
│                                                                  │
│   ⚖️ Candidate Comparison                                       │
│      • "Compare these 3 candidates"                             │
│      • "Rank candidates for this position"                      │
│      • "Who is the best fit and why?"                           │
│                                                                  │
│   🎤 Interview Preparation                                      │
│      • "Suggest interview questions"                            │
│      • "What should I probe deeper on?"                         │
│      • "Technical questions for this candidate"                 │
│                                                                  │
│   📝 Hiring Recommendations                                     │
│      • "Should I proceed with this candidate?"                  │
│      • "What concerns should I address?"                        │
│      • "Overall hiring recommendation"                          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Agent Orchestration Flow (LangGraph)

```
┌─────────────────────────────────────────────────────────────────┐
│                    LANGGRAPH AGENT FLOW                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│                      ┌──────────────┐                           │
│                      │ User Message │                           │
│                      └──────┬───────┘                           │
│                             │                                    │
│                             ▼                                    │
│                    ┌────────────────┐                           │
│                    │  RouterAgent   │                           │
│                    │ (Intent Class) │                           │
│                    └────────┬───────┘                           │
│                             │                                    │
│         ┌───────────────────┼───────────────────┐               │
│         │                   │                   │               │
│         ▼                   ▼                   ▼               │
│   ┌───────────┐      ┌───────────┐      ┌───────────┐          │
│   │  Resume   │      │  Search   │      │   Chat    │          │
│   │  Parser   │      │   Agent   │      │   Agent   │          │
│   └─────┬─────┘      └─────┬─────┘      └─────┬─────┘          │
│         │                  │                  │                 │
│         └──────────────────┴──────────────────┘                │
│                            │                                    │
│                            ▼                                    │
│                    ┌──────────────┐                             │
│                    │   Response   │                             │
│                    │  + UI Comps  │                             │
│                    └──────────────┘                             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Intent Classification

| Intent | Triggers | Agent |
|--------|----------|-------|
| `upload_resume` | File upload by candidate | ResumeParserAgent |
| `upload_job` | File upload by recruiter | JobParserAgent |
| `search_candidates` | Recruiter search query | SearchAgent |
| `search_jobs` | Candidate search query | SearchAgent |
| `chat_resume` | Resume-related questions | ChatAgent |
| `chat_job` | Job-related questions | ChatAgent |
| `general_chat` | General conversation | ChatAgent |

---

## 📊 Key Differences: Candidate vs Recruiter

| Feature | Candidate | Recruiter |
|---------|-----------|-----------|
| **Primary Action** | Upload Resume | Post Job Description |
| **Search Target** | Jobs | Candidates |
| **Document Type** | Resume (PDF/DOCX) | Job Description (PDF/DOCX) |
| **AI Focus** | Career guidance, job matching | Talent sourcing, evaluation |
| **Chat Context** | Own resume, potential jobs | Posted jobs, candidate pool |
| **Profile Fields** | Name, Email | Name, Email, Company |
| **Dashboard Color** | Indigo (blue) | Purple |
| **Key Actions** | Find jobs, prepare interviews | Find talent, compare candidates |

---

## 🔌 API Endpoints by Role

### Candidate Endpoints (`/api/candidate/*`)
```
POST /api/candidate/resume/upload      - Upload resume file
POST /api/candidate/resume/upload-text - Upload resume as text
GET  /api/candidate/resume             - Get parsed resume
GET  /api/candidate/jobs/search        - Search for matching jobs
POST /api/chat/candidate               - Chat with AI assistant
```

### Recruiter Endpoints (`/api/recruiter/*`)
```
POST /api/recruiter/job/upload         - Upload job description
POST /api/recruiter/job/upload-text    - Upload JD as text
GET  /api/recruiter/jobs               - List posted jobs
GET  /api/recruiter/candidates/search  - Search for candidates
POST /api/chat/recruiter               - Chat with AI assistant
```

---

## 🛠️ Technology Stack

```
┌─────────────────────────────────────────────────────────────────┐
│                       ARCHITECTURE                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────┐              ┌─────────────────┐           │
│  │    Frontend     │              │     Backend     │           │
│  │    Next.js      │◄────────────►│    FastAPI      │           │
│  │    TypeScript   │   REST API   │    Python       │           │
│  │    Tailwind     │              │    LangGraph    │           │
│  │    Thesys C1    │              │                 │           │
│  └─────────────────┘              └────────┬────────┘           │
│                                            │                     │
│                    ┌───────────────────────┼───────────────────┐│
│                    │                       │                   ││
│                    ▼                       ▼                   ▼│
│           ┌──────────────┐        ┌──────────────┐    ┌───────────┐
│           │    Qdrant    │        │   OpenAI     │    │ Langfuse  │
│           │  (Vectors)   │        │  (LLM/Embed) │    │ (Traces)  │
│           └──────────────┘        └──────────────┘    └───────────┘
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📈 Data Flow Summary

### Candidate Journey
```
Register → Upload Resume → AI Parses → Store in Qdrant → Search Jobs → Chat for Guidance → Apply
```

### Recruiter Journey
```
Register → Post Job → AI Parses → Store in Qdrant → Search Candidates → Chat for Analysis → Hire
```

---

## 🔒 Security & Access Control

- **JWT Authentication**: All API calls require valid JWT token
- **Role-based Access**: Endpoints are protected by user role
- **Middleware Guards**: `get_current_candidate()` and `get_current_recruiter()` dependencies
- **Cross-role Prevention**: Candidates cannot access recruiter endpoints and vice versa
