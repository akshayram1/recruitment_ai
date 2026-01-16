# AI Recruitment Platform

An AI-powered recruitment platform that enables candidates to find matching jobs and recruiters to find the best candidates using semantic search and conversational AI.

## 🏗️ Architecture

### Backend (Python + FastAPI)
- **LangGraph Multi-Agent System**: Orchestrates specialized AI agents for different tasks
- **OpenAI Integration**: GPT-4o for chat and text-embedding-3-small for semantic search
- **Qdrant Vector Database**: Stores resume and job embeddings for similarity search
- **Langfuse Observability**: Traces all LLM calls and agent operations
- **JWT Authentication**: Role-based access control for candidates and recruiters

### Frontend (Next.js + TypeScript)
- **Next.js 14**: React framework with App Router
- **Tailwind CSS**: Utility-first CSS framework
- **Thesys C1**: Generative UI components for dynamic chat interfaces
- **Zustand**: Lightweight state management

## 🚀 Getting Started

### Prerequisites
- Docker and Docker Compose
- Node.js 18+ (for local development)
- Python 3.11+ (for local development)

### Quick Start with Docker

1. Clone the repository:
```bash
cd recruitment-ai
```

2. Create environment file:
```bash
cp .env.example .env
# Edit .env with your API keys
```

3. Start all services:
```bash
docker-compose up -d
```

4. Access the application:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

### Local Development

#### Backend

1. Navigate to backend:
```bash
cd backend
```

2. Create virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Set up environment:
```bash
cp .env.example .env
# Edit .env with your API keys
```

5. Run the server:
```bash
uvicorn app.main:app --reload
```

#### Frontend

1. Navigate to frontend:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment:
```bash
cp .env.example .env
# Edit .env with your API keys
```

4. Run the development server:
```bash
npm run dev
```

## 📁 Project Structure

```
recruitment-ai/
├── backend/
│   ├── app/
│   │   ├── agents/           # LangGraph agents
│   │   │   ├── router_agent.py
│   │   │   ├── resume_parser_agent.py
│   │   │   ├── job_parser_agent.py
│   │   │   ├── search_agent.py
│   │   │   ├── chat_agent.py
│   │   │   └── graph.py
│   │   ├── api/routes/       # FastAPI routes
│   │   │   ├── auth.py
│   │   │   ├── candidate.py
│   │   │   ├── recruiter.py
│   │   │   └── chat.py
│   │   ├── db/               # Database layer
│   │   ├── models/           # Pydantic models
│   │   ├── prompts/          # Agent prompts (YAML)
│   │   ├── schemas/          # Request/Response schemas
│   │   ├── services/         # Business logic services
│   │   ├── config.py
│   │   └── main.py
│   ├── tests/
│   ├── Dockerfile
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── app/              # Next.js App Router
│   │   │   ├── candidate/
│   │   │   ├── recruiter/
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── components/       # React components
│   │   │   ├── thesys/       # Generative UI components
│   │   │   └── ui/           # Base UI components
│   │   ├── lib/              # Utilities
│   │   └── types/            # TypeScript types
│   ├── Dockerfile
│   └── package.json
│
├── docker-compose.yml
└── README.md
```

## 🤖 AI Agents

### Router Agent
Classifies user intent and routes to appropriate specialized agent:
- `upload_resume` - Parse and store resume
- `upload_job` - Parse and store job description
- `search_jobs` - Find matching jobs for candidate
- `search_candidates` - Find matching candidates for recruiter
- `chat_general` - General conversation
- `resume_insights` - Analyze resume
- `job_insights` - Analyze job requirements

### Resume Parser Agent
- Extracts structured data from PDF/DOCX resumes
- Generates embeddings for semantic search
- Stores in Qdrant vector database

### Job Parser Agent
- Parses job descriptions
- Extracts required skills, qualifications
- Generates embeddings for matching

### Search Agent
- Semantic similarity search in Qdrant
- Returns ranked results with match scores
- Supports natural language queries

### Chat Agent
- Context-aware conversations
- Maintains conversation history
- Generates UI components for rich responses

## 🔑 API Keys Required

| Service | Key | Purpose |
|---------|-----|---------|
| OpenAI | `OPENAI_API_KEY` | GPT-4o chat and embeddings |
| Langfuse | `LANGFUSE_SECRET_KEY`, `LANGFUSE_PUBLIC_KEY` | LLM observability |
| Thesys | `THESYS_API_KEY` | Generative UI components |

## 📊 Features

### For Candidates
- Upload and parse resumes (PDF/DOCX)
- AI-powered job matching
- Career advice and insights
- Skill gap analysis

### For Recruiters
- Post job descriptions
- Semantic candidate search
- AI-powered candidate ranking
- Match score breakdown

## 🛡️ Security

- JWT-based authentication
- Role-based access control
- Password hashing with bcrypt
- CORS configuration

## 📈 Observability

All LLM calls are traced with Langfuse:
- Token usage tracking
- Response time monitoring
- Cost analysis
- Prompt versioning

## 🧪 Testing

```bash
# Backend tests
cd backend
pytest

# Frontend tests
cd frontend
npm test
```

## 📝 License

MIT License
# recruitment_ai
# recruitment_ai
# recruitment_ai
