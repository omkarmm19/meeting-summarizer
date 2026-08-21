# Meeting Summarizer

A full-stack AI meeting intelligence workspace that transcribes audio recordings using Whisper ASR, generates structured executive summaries, and extracts deadline-tracked action items with assigned owners using Groq LLMs.

[![CI Pipeline](https://github.com/omkarmm19/meeting-summarizer/actions/workflows/ci.yml/badge.svg)](https://github.com/omkarmm19/meeting-summarizer/actions/workflows/ci.yml)
[![Live Demo](https://img.shields.io/badge/Live_Demo-Vercel-black?style=flat&logo=vercel)](https://meeting-summarizer-omkar.vercel.app)
[![API Status](https://img.shields.io/badge/Backend_API-Render-46E3B7?style=flat&logo=render)](https://meeting-summarizer-4pe8.onrender.com/api/health)

---

## Live Deployments

- **Frontend Application (Vercel):** [https://meeting-summarizer-omkar.vercel.app](https://meeting-summarizer-omkar.vercel.app)
- **Backend API (Render):** [https://meeting-summarizer-4pe8.onrender.com](https://meeting-summarizer-4pe8.onrender.com)
- **API Documentation (Swagger UI):** [https://meeting-summarizer-4pe8.onrender.com/docs](https://meeting-summarizer-4pe8.onrender.com/docs)
- **Health Check Endpoint:** [https://meeting-summarizer-4pe8.onrender.com/api/health](https://meeting-summarizer-4pe8.onrender.com/api/health)

---

## Key Features

- **Split-Hero Editorial Workspace:** Clean, editorial design system featuring warm cream (`#f4f1ea`), terracotta (`#c25e3a`) accents, Fraunces serif headings, and JetBrains Mono metadata typography.
- **Whisper Speech-to-Text (ASR):** Automatic transcription using OpenAI Whisper (`whisper-1`) with automated fallback to Groq Whisper (`whisper-large-v3`).
- **Deterministic Structured LLM Extraction:** Uses Groq (`openai/gpt-oss-120b`) in JSON Mode with `temperature: 0.0` for consistent, hallucination-free executive summaries and decisions.
- **Strict Assignee & Deadline Tracking:** Detects specific clock times (`11:15 AM`, `11:30 AM`), timeframes (`Before arrival`, `End of meeting`), and assigned owners for every action item.
- **Custom Interactive Audio Player:** Built-in HTML5 waveform visualizer, skip +/- 5s controls, volume/mute toggle, speed selector (`1x`, `1.25x`, `1.5x`, `2x`), and authenticated Blob streaming.
- **Action Items Productivity Suite:** Interactive checkboxes with live completion progress bar (`X of Y completed`), status filter tabs (`All`, `Pending`, `Done`), and one-click Markdown checklist export.
- **Searchable Transcripts:** Real-time word search with match counter and one-click clipboard copy.
- **Multi-Tenant JWT Isolation:** Full user authentication with bcrypt password hashing and tenant-isolated meeting storage.

---

## Architecture

```text
+-------------------------------------------------------------------------+
|                        Web Browser (Client UI)                          |
|  - React 18 + Vite SPA                                                  |
|  - Custom Waveform Audio Player & Scrubbing                             |
|  - Instant Optimistic State & Polling Coordination                     |
|  - Export Markdown / JSON                                               |
+------------------------------------+------------------------------------+
                                     |
                       HTTPS / REST (JWT Bearer / Query Token)
                                     |
                                     v
+-------------------------------------------------------------------------+
|                         Vercel Edge Proxy Layer                         |
|  - Global Static Asset CDN Hosting                                      |
|  - vercel.json: Reverse Proxy /api/* -> Render Backend                  |
+------------------------------------+------------------------------------+
                                     |
                                     v
+-------------------------------------------------------------------------+
|                         FastAPI Backend (Render)                        |
|  - Auth Endpoints: /api/auth (signup, login, profile)                   |
|  - Meeting Endpoints: /api/meetings (upload, list, detail, audio, delete|
|  - System Endpoints: / and /api/health (UptimeRobot monitoring)         |
|  - Async Background Task Worker (Pipeline Orchestration)                |
+-----------------+-------------------+-------------------+---------------+
                  |                   |                   |
                  v                   v                   v
     +--------------------+   +---------------+   +--------------------+
     |  Neon PostgreSQL   |   | Upstash Redis |   | Cloud Disk Storage |
     | - Users & Auth     |   | - Status cache|   | - Uploaded audio   |
     | - Metadata/Summary |   | - Fast polls  |   |   (storage/audio/) |
     +--------------------+   +---------------+   +--------------------+
                  |                   |
                  +---------+---------+
                            |
                            v
+-------------------------------------------------------------------------+
|                          External AI Services                           |
|  1. ASR Speech-to-Text: OpenAI Whisper ("whisper-1") / Groq Whisper    |
|  2. Structured LLM: Groq API ("openai/gpt-oss-120b") JSON Mode          |
+-------------------------------------------------------------------------+
```

---

## Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite, Vanilla CSS Design System, Lucide Icons |
| **Backend** | Python 3.11, FastAPI, Uvicorn, SQLAlchemy ORM, Pydantic v2 |
| **Database** | PostgreSQL (hosted on Neon Serverless) |
| **Cache** | Redis (hosted on Upstash Serverless) |
| **ASR (Speech-to-Text)** | OpenAI Whisper (`whisper-1`) + Groq Whisper (`whisper-large-v3`) fallback |
| **LLM Inference** | Groq LPU (`openai/gpt-oss-120b`, `llama-3.3-70b-versatile`) in JSON Mode |
| **Authentication** | JWT (JSON Web Tokens), Passlib Bcrypt |
| **CI / CD & Cloud** | GitHub Actions, Vercel, Render, UptimeRobot |
| **Containerization** | Docker, Docker Compose, Nginx Reverse Proxy |

---

## Setup Instructions

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm
- (Optional) Docker and Docker Compose

### 1. Clone the Repository
```bash
git clone https://github.com/omkarmm19/meeting-summarizer.git
cd meeting-summarizer
```

### 2. Configure Environment Variables
Copy `.env.example` to `backend/.env`:
```bash
cp .env.example backend/.env
```

Configure your credentials in `backend/.env`:
- **`DATABASE_URL`**: Neon PostgreSQL connection string (`postgresql://...`).
- **`REDIS_URL`**: Upstash Redis connection string (`rediss://...`).
- **`GROQ_API_KEY`**: Groq API key from [console.groq.com](https://console.groq.com).
- **`OPENAI_API_KEY`**: (Optional) OpenAI API key for primary Whisper transcription.
- **`JWT_SECRET_KEY`**: Random 32+ character string for token signing.

### 3. Run Backend Locally
```bash
# Create and activate virtual environment
python3 -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install -r backend/requirements.txt

# Start backend server
uvicorn app.main:app --app-dir backend --reload --port 8000
```
Backend API will run at `http://localhost:8000` (Swagger docs at `http://localhost:8000/docs`).

### 4. Run Frontend Locally
In a separate terminal:
```bash
cd frontend
npm install
npm run dev
```
Frontend application will run at `http://localhost:5173`.

### 5. Run Entire Stack with Docker Compose
```bash
docker compose up --build
```
Access the application locally via Nginx at `http://localhost`.

---

## Environment Variables

| Variable | Description | Default / Example |
| :--- | :--- | :--- |
| `DATABASE_URL` | PostgreSQL connection string (Neon or local) | `postgresql://user:pass@host/db?sslmode=require` |
| `REDIS_URL` | Redis connection URL (Upstash or local) | `rediss://default:pass@host:6379` |
| `OPENAI_API_KEY` | OpenAI API key for Whisper transcription | `sk-...` |
| `GROQ_API_KEY` | Groq API key for LLM summarization and Whisper ASR | `gsk_...` |
| `GROQ_MODEL` | Groq chat completion model identifier | `openai/gpt-oss-120b` |
| `JWT_SECRET_KEY` | Secret key used to sign JWT access tokens | String (min 32 chars) |
| `JWT_ALGORITHM` | Algorithm used for JWT encoding | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Access token lifetime in minutes | `10080` (7 days) |
| `STORAGE_DIR` | Directory to store uploaded audio files | `./backend/storage/audio` |
| `MAX_FILE_SIZE_MB` | Maximum allowed audio upload size | `25` |
| `MOCK_SERVICES` | Set to `true` to run offline with mock responses | `false` |
| `CORS_ORIGINS` | Allowed CORS origins for frontend requests | `*` |

---

## API Reference

### Authentication

#### `POST /api/auth/signup`
Creates a new user account and returns a JWT access token.
```json
{
  "email": "user@example.com",
  "password": "securepassword123",
  "full_name": "Alex Smith"
}
```

#### `POST /api/auth/login`
Authenticates credentials and returns a JWT token.
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

#### `GET /api/auth/me`
Returns the authenticated user's profile. Requires `Authorization: Bearer <token>`.

---

### Meetings

#### `POST /api/meetings/upload`
Uploads audio file (`.mp3`, `.wav`, `.m4a`, `.aac`, `.ogg`, `.webm`) up to 25MB and triggers asynchronous background processing.

#### `GET /api/meetings`
Lists all meetings belonging to the authenticated user ordered by creation date.

#### `GET /api/meetings/{id}`
Returns complete analysis, status, transcript, executive summary, key decisions, and action items.

#### `GET /api/meetings/{id}/audio`
Streams raw audio for in-browser playback. Accepts authentication via `Authorization: Bearer <token>` header or `?token=<jwt>` query parameter. Supports both `GET` and `HEAD` requests for media preloading.

#### `DELETE /api/meetings/{id}`
Permanently deletes the meeting record and removes the associated audio file from storage.

---

### System & Health

#### `GET /`
Root endpoint returning API status and docs URLs (used by UptimeRobot).

#### `GET /api/health`
Detailed system health endpoint checking active connection to PostgreSQL and Redis.
```json
{
  "status": "ok",
  "database": "connected",
  "redis": "connected"
}
```

---

## Automated Testing

Run the full pytest suite with:
```bash
pytest backend/tests -v
```

### Test Coverage (18 / 18 Passing):
- `test_api.py` (8 tests): Health check, valid upload, invalid file extension rejection, empty file rejection, list meetings, meeting detail retrieval, 404 handling, and meeting deletion.
- `test_auth.py` (5 tests): User signup & profile retrieval, duplicate email prevention, login validation, 401 unauthorized protection, and multi-tenant user data isolation.
- `test_services.py` (5 tests): ASR service mock fallback, missing audio file handling, LLM structured JSON parsing, empty transcript validation error, and end-to-end background processor pipeline.

---

## Continuous Integration & Deployment

- **GitHub Actions (CI):** Every push to `main` executes unit tests, builds the frontend bundle, and validates Docker Compose configurations.
- **Vercel (CD):** Automatically deploys frontend updates with edge caching and API proxying.
- **Render (CD):** Automatically deploys FastAPI backend with Uvicorn worker management.
- **UptimeRobot:** Monitors `https://meeting-summarizer-4pe8.onrender.com/` on a 5-minute interval to keep the free instance warm.
