import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from app.config import settings
from app.database import engine, Base
from app.routers import upload, meetings, auth
from app.schemas import HealthResponse
from app.services.redis_service import ping_redis

# Configure standard logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("meetlytic")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables on startup
    logger.info("Initializing database tables...")
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Database schema initialized successfully.")
    except Exception as exc:
        logger.warning(f"Could not connect to database on startup ({exc}). Will connect on demand.")
    yield
    logger.info("Shutting down Meetlytic application.")


app = FastAPI(
    title="Meeting Summarizer API",
    description="Full-stack AI meeting summarizer backend powered by Whisper ASR and Groq LLM",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS Middleware
cors_origins = settings.cors_origins_list
is_wildcard = "*" in cors_origins or settings.CORS_ORIGINS.strip() == "*"

if is_wildcard:
    app.add_middleware(
        CORSMiddleware,
        allow_origin_regex=r"^https?://.*",
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
else:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# Register Routers
app.include_router(auth.router, prefix="/api")
app.include_router(upload.router, prefix="/api")
app.include_router(meetings.router, prefix="/api")


@app.get(
    "/api/health",
    response_model=HealthResponse,
    status_code=status.HTTP_200_OK,
    tags=["System"],
    summary="Health check for API, Database, and Redis"
)
def health_check():
    db_status = "connected"
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
    except Exception as exc:
        db_status = f"unhealthy: {str(exc)}"

    redis_healthy = ping_redis()
    redis_status = "connected" if redis_healthy else "offline_or_unreachable"

    overall_status = "ok" if db_status == "connected" else "degraded"

    return HealthResponse(
        status=overall_status,
        database=db_status,
        redis=redis_status
    )
