# ResumeAI — ATS-Optimized Resume Analyzer

An AI-powered platform that parses resumes, scores them against job descriptions, identifies skill gaps, and delivers ranked recommendations — all powered by Google Gemini.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Django 4.2 + Django REST Framework |
| AI | Google Gemini 1.5 Pro |
| Task Queue | Celery + Redis |
| Database | PostgreSQL 16 |
| Frontend | Next.js 14 + TypeScript + Tailwind CSS |
| Auth | JWT (SimpleJWT) |
| Containerization | Docker + Docker Compose |

---

## Getting Started

### Prerequisites

- Python 3.12+
- Node.js 18+
- Docker & Docker Compose

### 1. Clone and configure

```bash
git clone <repo-url>
cd "AI Resume Analyzer & ATS Optimization Platform"
cp .env.example .env
# Fill in your values — especially GEMINI_API_KEY and SECRET_KEY
```

### 2. Start the database

```bash
docker compose up db redis -d
```

PostgreSQL is exposed on **localhost:5433** (5432 is reserved for a local Postgres install).

### 3. Backend (local dev)

```bash
cd backend
python3.12 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

python manage.py migrate
python manage.py runserver          # http://localhost:8000
```

In a separate terminal, start Celery (needed for resume parsing and analysis):

```bash
cd backend
source venv/bin/activate
celery -A core worker -l info
```

### 4. Frontend (local dev)

```bash
cd frontend
npm install
npm run dev                         # http://localhost:3000
```

---

## Running with Docker (full stack)

```bash
# Build and start everything
docker compose up --build

# App is available at http://localhost:80
```

Services started by Docker Compose:

| Service | Port |
|---------|------|
| nginx (reverse proxy) | 80 |
| frontend (Next.js) | internal |
| backend (Gunicorn) | internal |
| celery_worker | — |
| celery_beat | — |
| flower (task monitor) | 5555 |
| redis | internal |
| db (PostgreSQL) | 5433 (host) |

---

## Environment Variables

Copy `.env.example` to `.env` and fill in:

| Variable | Description |
|----------|-------------|
| `SECRET_KEY` | Django secret key |
| `GEMINI_API_KEY` | Google AI Studio API key |
| `POSTGRES_DB` | Database name |
| `POSTGRES_USER` | Database user |
| `POSTGRES_PASSWORD` | Database password |
| `POSTGRES_HOST` | `localhost` (local) or `db` (Docker) |
| `POSTGRES_PORT` | `5433` (local) or `5432` (Docker) |
| `JWT_SECRET_KEY` | JWT signing key |

---

## Running Tests

```bash
cd backend
source venv/bin/activate
pytest apps/ -v
```

44 tests covering auth, resumes, jobs, analysis, and the ATS scoring engine.

---

## Project Structure

```
.
├── backend/
│   ├── apps/
│   │   ├── accounts/       # User auth (register, login, JWT, profile)
│   │   ├── resumes/        # Resume upload, parsing, management
│   │   ├── jobs/           # Job description ingestion & parsing
│   │   └── analysis/       # ATS scoring, Gemini match analysis
│   │       └── services/
│   │           ├── gemini.py      # Gemini prompts & parsing
│   │           └── ats_scorer.py  # Local heuristic ATS scorer
│   ├── core/
│   │   └── settings/       # base / development / production / test
│   └── requirements.txt
├── frontend/
│   └── src/
│       ├── app/
│       │   ├── (auth)/     # Login & register pages
│       │   └── (dashboard)/ # Dashboard, resumes, jobs, analysis
│       ├── hooks/          # useAuth (AuthProvider + hook)
│       ├── lib/            # api client, auth helpers, utils
│       └── types/          # Shared TypeScript interfaces
├── nginx/                  # Reverse proxy config
├── docker-compose.yml
└── .env.example
```

---

## API Reference

All endpoints are prefixed with `/api/v1/`.

| Resource | Endpoints |
|----------|-----------|
| Auth | `POST /auth/register/`, `POST /auth/login/`, `POST /auth/logout/`, `GET/PATCH /auth/profile/`, `POST /auth/token/refresh/` |
| Resumes | `GET/POST /resumes/`, `GET/DELETE /resumes/{id}/`, `POST /resumes/{id}/set-primary/` |
| Jobs | `GET/POST /jobs/`, `GET/DELETE /jobs/{id}/` |
| Analysis | `GET/POST /analysis/`, `GET /analysis/{id}/`, `GET /analysis/dashboard/` |

---

## How It Works

1. **Upload resume** → file stored, Celery task queued
2. **Gemini parses** the raw text into structured JSON (skills, experience, education, contact info)
3. **Add a job description** → Gemini extracts required/preferred skills and keywords
4. **Run analysis** → local ATS heuristics run first; Gemini performs deep match scoring
5. **View results** → ATS score, match %, skill gaps, strengths, ranked recommendations
