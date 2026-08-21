# Meeting Summarizer

An end-to-end full-stack AI platform that converts raw meeting audio into structured, action-oriented intelligence. By combining high-accuracy speech-to-text transcription (OpenAI Whisper) with structured JSON extraction (Groq LLaMA 3.3), Meeting Summarizer delivers executive summaries, key decisions, and actionable task checklists in seconds.

---

## 📌 Problem Statement

Teams spend countless hours in meetings, yet critical takeaways and action items often get lost in lengthy voice recordings or fragmented meeting notes. Manual transcription and summarization is tedious, error-prone, and delays execution.

**Meeting Summarizer** solves this by automating the entire meeting lifecycle:
1. **Audio Ingestion**: Accepts standard audio recordings (MP3, WAV, M4A, AAC, WEBM, OGG) with strict format and size validation.
2. **ASR Speech-to-Text**: Converts spoken discussions into verbatim transcripts using OpenAI's Whisper model.
3. **Structured AI Extraction**: Analyzes transcripts via Groq API (LLaMA 3.3) in strict JSON mode to isolate an executive overview, bulleted key decisions, and assigned action items with owners and deadlines.
4. **Interactive Dashboard**: Provides a responsive web interface for playback, live progress tracking, full transcript search, checklist completion, and markdown/JSON export.

---

## 🏛️ System Architecture

```text
+-----------------------------------------------------------------------------------------+
|                                    CLIENT BROWSER                                       |
|  [ React 18 (Vite) Dashboard / Upload Form / Status Stepper / Action Checklist / Export]|
+--------------------------------------------+--------------------------------------------+
                                             | HTTP / REST (Port 80)
                                             v
+-----------------------------------------------------------------------------------------+
|                                  NGINX REVERSE PROXY                                    |
|   - Routes /api/* -> FastAPI Backend (:8000)                                            |
|   - Routes /*     -> React Frontend (:80)                                               |
|   - Configured client_max_body_size: 50M                                                |
+----------------------+------------------------------------+-----------------------------+
                       |                                    |
                       v                                    v
+-----------------------------------+      +----------------------------------------------+
|         FRONTEND SERVICE          |      |             FASTAPI BACKEND APP              |
| - Multi-stage Nginx static server |      | - REST API Endpoints (/upload, /meetings)    |
| - Responsive Vanilla CSS UI       |      | - Chunked audio streamer (25MB limit)        |
+-----------------------------------+      | - BackgroundTasks processing pipeline        |
                                           +----------------------+-----------------------+
                                                                  |
              +---------------------------------------------------+--------------------+
              |                                                   |                    |
              v                                                   v                    v
+---------------------------+                    +---------------------+      +----------------+
|    POSTGRESQL DATABASE    |                    |     REDIS CACHE     |      | LOCAL STORAGE  |
| - Meetings Table (UUID)   |                    | - Status tracker    |      | - Persistent   |
| - Transcripts & Summaries |                    | - Pub/Sub events    |      |   volume under |
| - JSON Key Decisions      |                    | - Fast polling      |      |   storage/audio|
| - JSON Action Items       |                    +---------------------+      +----------------+
+---------------------------+                               |
              |                                             |
              v                                             v
+-----------------------------------------------------------------------------------------+
|                                 AI PROCESSING SERVICES                                  |
|                                                                                         |
|  1. OpenAI Whisper API ("whisper-1")   ---> Audio Transcription to Raw Text             |
|  2. Groq LLM API ("llama-3.3-70b")     ---> Strict JSON Mode Structured Analysis        |
|  3. Resilient Error Handling           ---> 1x Retry on JSON parse, status="failed" log |
+-----------------------------------------------------------------------------------------+
```

---

## 🚀 Quick Start (Docker Compose)

### 1. Clone the Repository
```bash
git clone https://github.com/omkarmm19/meeting-summarizer.git
cd meeting-summarizer
```

### 2. Configure Environment Variables
Copy `.env.example` into `.env` (or configure in `backend/.env`):
```bash
cp backend/.env.example .env
```

Edit `.env` with your API credentials:
```env
# Database & Redis (defaults work out-of-the-box in Docker)
DATABASE_URL=postgresql://postgres:postgres@db:5432/meetings_db
REDIS_URL=redis://redis:6379/0

# AI Provider API Keys
OPENAI_API_KEY=sk-your-openai-key-here
GROQ_API_KEY=gsk_your-groq-key-here
GROQ_MODEL=llama-3.3-70b-versatile

# Storage & Upload Configuration
STORAGE_DIR=/app/storage/audio
MAX_FILE_SIZE_MB=25

# Set to true to test full pipeline without consuming API credits
MOCK_SERVICES=false
```

### 3. Launch Services
```bash
docker-compose up --build
```
Once initialized:
- **Web Dashboard**: [http://localhost](http://localhost)
- **FastAPI Interactive Swagger Docs**: [http://localhost/api/docs](http://localhost/api/docs)
- **Health Check Endpoint**: [http://localhost/api/health](http://localhost/api/health)

---

## 🧪 Local Development & Testing

### Backend Setup & Pytest
```bash
# 1. Navigate to backend and create virtualenv
cd backend
python3 -m venv .venv
source .venv/bin/activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Run all automated tests
pytest tests -v
```

### Frontend Setup
```bash
# 1. Navigate to frontend
cd frontend

# 2. Install dependencies
npm install

# 3. Start development dev-server
npm run dev

# 4. Build for production
npm run build
```

---

## 📡 API Specification & Sample Requests

### 1. Health Check
```bash
curl -X GET "http://localhost/api/health"
```
**Sample Response:**
```json
{
  "status": "ok",
  "database": "connected",
  "redis": "connected"
}
```

---

### 2. Upload Meeting Audio
Uploads meeting audio (`multipart/form-data`), writes file to storage, creates a `pending` DB record, and starts asynchronous processing in the background.

```bash
curl -X POST "http://localhost/api/meetings/upload" \
  -H "accept: application/json" \
  -F "file=@sample_meeting.mp3;type=audio/mpeg"
```
**Sample Response (`201 Created`):**
```json
{
  "id": "e4b9868c-9a4f-4d37-a169-c603cbdb64b2",
  "filename": "sample_meeting.mp3",
  "status": "pending",
  "message": "Audio file uploaded successfully. Processing initiated.",
  "created_at": "2026-08-21T09:15:00Z"
}
```

---

### 3. Get Meeting Details
Returns the complete status, transcript, executive summary, key decisions, and action items.

```bash
curl -X GET "http://localhost/api/meetings/e4b9868c-9a4f-4d37-a169-c603cbdb64b2"
```
**Sample Response (`200 OK`):**
```json
{
  "id": "e4b9868c-9a4f-4d37-a169-c603cbdb64b2",
  "filename": "sample_meeting.mp3",
  "file_size_bytes": 3418290,
  "status": "done",
  "transcript": "Alex: Thanks everyone for joining today's sprint review...",
  "summary": "The team held a Q3 Product & Engineering sync to address checkout latency and review sprint deliverables. Sarah identified a database indexing bottleneck and will migrate queries to a composite index. Michael finalized the new UI design tokens in Figma. Finally, the team agreed to adopt Redis for distributed task queues.",
  "key_decisions": [
    "Migrate user transactions database queries to use a composite index on (user_id, created_at).",
    "Deprecate legacy button components in favor of unified design system tokens.",
    "Adopt Redis for task queues and caching layer instead of Celery/RabbitMQ."
  ],
  "action_items": [
    {
      "task": "Implement and deploy database composite indexing migration on user transactions table",
      "owner": "Sarah",
      "deadline": "This Friday"
    },
    {
      "task": "Update frontend design system with new Figma button components and tokens",
      "owner": "Michael",
      "deadline": "Next Tuesday"
    },
    {
      "task": "Setup Redis Docker configuration, connection pooling, and team documentation",
      "owner": "David",
      "deadline": "Wednesday EOD"
    }
  ],
  "error_message": null,
  "created_at": "2026-08-21T09:15:00Z",
  "updated_at": "2026-08-21T09:15:42Z"
}
```

---

### 4. List All Meetings
Returns all previous meeting sessions sorted by most recent.

```bash
curl -X GET "http://localhost/api/meetings"
```

---

### 5. Stream Raw Audio File
Streams audio bytes for in-browser playback.

```bash
curl -X GET "http://localhost/api/meetings/e4b9868c-9a4f-4d37-a169-c603cbdb64b2/audio" \
  --output downloaded_meeting.mp3
```

---

### 6. Delete Meeting
Deletes the meeting DB record and purges audio from storage.

```bash
curl -X DELETE "http://localhost/api/meetings/e4b9868c-9a4f-4d37-a169-c603cbdb64b2"
```

---

## 💡 Key Design Decisions

| Decision | Choice | Rationale |
| :--- | :--- | :--- |
| **ASR Provider** | **OpenAI Whisper API (`whisper-1`)** | Industry-standard speech-to-text accuracy with robust support for conversational overlap, multiple accents, and technical jargon. |
| **LLM Provider & Mode** | **Groq API (`llama-3.3-70b-versatile`) with JSON Mode** | Groq's LPU architecture delivers near-instantaneous structured inference (<1.5s latency). Using native `response_format: {"type": "json_object"}` guarantees strict schema compliance without hallucinated markdown formatting. |
| **Storage Architecture** | **Local Volume Mount (`backend/storage/audio/`)** | Adheres strictly to zero-cloud-storage requirements while ensuring audio files persist across Docker container restarts without external dependencies (S3/GCS). |
| **Status Queue & Caching** | **Redis (`redis:7-alpine`)** | Provides low-overhead status tracking for frontend polling and separates cache state from relational meeting metadata. |
| **Relational Database** | **PostgreSQL (v16) via SQLAlchemy** | ACID-compliant storage with native `JSONB` support for structured key decisions and action items, while supporting UUID primary keys. |
| **Frontend Styling** | **Modern Vanilla CSS (Custom Design System)** | Zero heavy external component libraries (No Bootstrap/Material/Tailwind) ensures lightweight bundles, fast load times, and custom-tailored dark glassmorphic aesthetics. |

---

## ⚠️ Known Limitations & Future Enhancements

1. **Speaker Diarization**: Whisper API produces verbatim speech transcripts but does not assign speaker labels out of the box. Future iterations can integrate PyAnnote or Deepgram for multi-speaker identification.
2. **Multi-Chunk Audio Splitting**: Audio files larger than 25MB are currently rejected according to the Whisper single-file limit. An automated chunking service (via FFmpeg) can be added to support multi-hour recordings.
3. **Real-time WebSockets / SSE**: The current frontend polls status every 2.5 seconds. Redis Pub/Sub is already wired in the backend and can be exposed via WebSockets for sub-second push notifications.

---

## 📄 License
MIT License. Developed for University / Internship Project Submission.
