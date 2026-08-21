# Meeting Summarizer

A full-stack web application that transcribes meeting audio and extracts structured summaries, key decisions, and action items with assigned owners and deadlines.

---

## Problem Statement

Meetings often produce lengthy discussions where decisions and action items get buried in audio recordings or unorganized notes. This project automates the extraction of concise executive overviews, key decisions, and task lists from uploaded audio files using speech recognition and large language model extraction.

---

## Architecture

```text
+-------------------------------------------------------------------------+
|                              Web Browser                                |
|        (React 18 + Vite UI, Authentication, Audio Player, Export)       |
+------------------------------------+------------------------------------+
                                     |
                       HTTP / REST (JWT Bearer Auth)
                                     |
                                     v
+-------------------------------------------------------------------------+
|                             FastAPI Backend                             |
|  - Auth Routes: /api/auth (signup, login, profile)                      |
|  - Meeting Routes: /api/meetings (upload, list, detail, audio, delete)  |
|  - Background Tasks: Audio processing & pipeline coordination           |
+-----------------+-------------------+-------------------+---------------+
                  |                   |                   |
                  v                   v                   v
     +--------------------+   +---------------+   +--------------------+
     |  Neon PostgreSQL   |   | Upstash Redis |   | Local Disk Storage |
     | - Users & Auth     |   | - Status cache|   | - Uploaded audio   |
     | - Metadata/Summary |   | - Pub/Sub     |   |   (storage/audio/) |
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

- **Frontend**: React 18, Vite, Vanilla CSS
- **Backend**: Python 3.10+, FastAPI, Uvicorn, SQLAlchemy ORM, Pydantic v2
- **Authentication**: JWT (JSON Web Tokens), Bcrypt password hashing
- **Database**: PostgreSQL (hosted on Neon Serverless) with SQLite local fallback
- **Cache**: Redis (hosted on Upstash Serverless) with in-memory fallback
- **Speech-to-Text (ASR)**: OpenAI Whisper API (`whisper-1`) with Groq Whisper (`whisper-large-v3`) fallback
- **LLM Summarization**: Groq API (`openai/gpt-oss-120b`) using JSON Mode
- **Testing**: Pytest, FastAPI TestClient, AnyIO

---

## Setup Instructions

### Prerequisites
- Python 3.10 or higher
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

Fill in your service credentials in `backend/.env`:
- **Neon PostgreSQL**: Create a free database at [neon.tech](https://neon.tech), copy the connection string (`postgresql://...`).
- **Upstash Redis**: Create a free Redis database at [upstash.com](https://upstash.com), copy the `rediss://...` connection URL.
- **Groq API Key**: Create a free API key at [console.groq.com](https://console.groq.com).
- **OpenAI API Key**: Optional, from [platform.openai.com](https://platform.openai.com) (Groq Whisper acts as fallback if not set).

### 3. Run Backend
```bash
# Create and activate virtual environment
python3 -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install -r backend/requirements.txt

# Start backend server
uvicorn app.main:app --app-dir backend --reload --port 8000
```
Backend API will run at `http://localhost:8000`. Swagger documentation is accessible at `http://localhost:8000/docs`.

### 4. Run Frontend
In a new terminal:
```bash
cd frontend
npm install
npm run dev
```
Frontend interface will run at `http://localhost:5173`.

### 5. (Alternative) Run with Docker Compose
```bash
docker-compose up --build
```
Access the application at `http://localhost`.

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
| `CORS_ORIGINS` | Comma-separated list of allowed frontend origins | `http://localhost:5173,http://localhost:80` |

---

## API Documentation

All protected endpoints require the `Authorization: Bearer <token>` header obtained from signup or login.

### Authentication

#### `POST /api/auth/signup`
Registers a new user account.
```bash
curl -X POST "http://localhost:8000/api/auth/signup" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securepassword123",
    "full_name": "Alex Smith"
  }'
```
**Response (201 Created):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer",
  "user": {
    "id": "1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed",
    "email": "user@example.com",
    "full_name": "Alex Smith",
    "created_at": "2026-08-21T10:00:00+00:00"
  }
}
```

#### `POST /api/auth/login`
Authenticates user credentials.
```bash
curl -X POST "http://localhost:8000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securepassword123"
  }'
```

#### `GET /api/auth/me`
Fetches current authenticated user profile.
```bash
curl -X GET "http://localhost:8000/api/auth/me" \
  -H "Authorization: Bearer <token>"
```

---

### Meetings

#### `POST /api/meetings/upload`
Uploads audio file and initiates background processing.
```bash
curl -X POST "http://localhost:8000/api/meetings/upload" \
  -H "Authorization: Bearer <token>" \
  -F "file=@meeting.wav"
```
**Response (201 Created):**
```json
{
  "id": "7ab7925f-1f65-4654-81be-4f4b9f8d95fc",
  "filename": "meeting.wav",
  "status": "pending",
  "message": "Audio file uploaded successfully. Processing initiated.",
  "created_at": "2026-08-21T10:47:45.878724+00:00"
}
```

#### `GET /api/meetings`
Lists all meetings belonging to the authenticated user.
```bash
curl -X GET "http://localhost:8000/api/meetings" \
  -H "Authorization: Bearer <token>"
```

#### `GET /api/meetings/{id}`
Returns complete analysis and transcript for a meeting.
```bash
curl -X GET "http://localhost:8000/api/meetings/7ab7925f-1f65-4654-81be-4f4b9f8d95fc" \
  -H "Authorization: Bearer <token>"
```
**Response (200 OK):**
```json
{
  "id": "7ab7925f-1f65-4654-81be-4f4b9f8d95fc",
  "filename": "meeting.wav",
  "file_size_bytes": 3249924,
  "status": "done",
  "transcript": "Speaker discussed project timeline and deliverables...",
  "summary": "The team reviewed sprint milestones and assigned backend and frontend deliverables.",
  "key_decisions": [
    "Adopt PostgreSQL for relational metadata storage.",
    "Target next Friday for initial feature freeze."
  ],
  "action_items": [
    {
      "task": "Deploy database migration scripts",
      "owner": "Sarah",
      "deadline": "Friday"
    },
    {
      "task": "Update frontend state handling",
      "owner": "David",
      "deadline": "Next Tuesday"
    }
  ],
  "error_message": null,
  "created_at": "2026-08-21T10:47:45.878724+00:00",
  "updated_at": "2026-08-21T10:48:21.646732+00:00"
}
```

#### `GET /api/meetings/{id}/audio`
Streams raw audio for in-browser playback.
```bash
curl -X GET "http://localhost:8000/api/meetings/{id}/audio" \
  -H "Authorization: Bearer <token>"
```

#### `DELETE /api/meetings/{id}`
Deletes meeting record from database and removes audio file from disk.
```bash
curl -X DELETE "http://localhost:8000/api/meetings/{id}" \
  -H "Authorization: Bearer <token>"
```

---

### System

#### `GET /api/health`
Health check endpoint returning database and cache connection status.
```bash
curl -X GET "http://localhost:8000/api/health"
```
**Response (200 OK):**
```json
{
  "status": "ok",
  "database": "connected",
  "redis": "connected"
}
```

---

## Design Decisions

- **Neon PostgreSQL**: Provides a cloud-hosted serverless PostgreSQL instance so reviewers can run and test the application without installing or configuring a local database server.
- **Upstash Redis**: Serves fast in-memory status checks during background processing so frontend polling does not overwhelm relational database queries.
- **JWT Authentication & Tenant Isolation**: Implements user-level data isolation via foreign keys (`Meeting.user_id = User.id`), ensuring meetings are strictly private to each user.
- **Whisper & Groq Pipeline**: OpenAI Whisper (`whisper-1`) provides high transcription accuracy, with Groq Whisper (`whisper-large-v3`) configured as an automated fallback. Groq LPU inference enables sub-2-second JSON structured extraction.
- **Local Audio Storage**: Audio files are stored on disk (`backend/storage/audio/`) with unique UUID identifiers to avoid third-party storage overhead while maintaining data persistence.

---

## Known Limitations

1. **Speaker Diarization**: Whisper generates verbatim transcripts but does not automatically identify speaker names (diarization).
2. **File Size Limit**: Audio files are limited to 25MB per upload (Whisper API maximum file size limit).
3. **Polling vs WebSockets**: The UI polls the backend every 2.5 seconds while processing. WebSockets could be added for push-based updates.

---

## Testing

Run the automated test suite with pytest:
```bash
pytest backend/tests -v
```

Current test status: **18 passed** (100% pass rate).
- `test_api.py`: 8 tests covering health check, file upload, validation, retrieval, and deletion.
- `test_auth.py`: 5 tests covering registration, login, error states, and multi-tenant isolation.
- `test_services.py`: 5 tests covering ASR fallback, LLM parsing, validation errors, and end-to-end background processing.
