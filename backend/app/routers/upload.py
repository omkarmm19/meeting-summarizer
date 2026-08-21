import os
import uuid
import logging
from fastapi import APIRouter, UploadFile, File, BackgroundTasks, HTTPException, Depends, status
from sqlalchemy.orm import Session
from app.config import settings
from app.database import get_db
from app.models import Meeting, MeetingStatus, User
from app.schemas import MeetingUploadResponse
from app.services.processor import process_meeting_audio
from app.services.redis_service import update_meeting_cache
from app.dependencies import get_current_user

router = APIRouter(tags=["Upload"])
logger = logging.getLogger(__name__)

ALLOWED_EXTENSIONS = {
    ".mp3", ".wav", ".m4a", ".mp4", ".webm", ".ogg",
    ".flac", ".aac", ".mpeg", ".oga", ".opus"
}

ALLOWED_MIME_TYPES = {
    "audio/mpeg", "audio/mp3", "audio/wav", "audio/x-wav",
    "audio/mp4", "audio/m4a", "audio/x-m4a", "audio/webm",
    "audio/ogg", "audio/flac", "audio/x-flac", "audio/aac",
    "video/mp4", "video/webm"
}


@router.post(
    "/meetings/upload",
    response_model=MeetingUploadResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload meeting audio for ASR transcription and AI summarization"
)
async def upload_meeting_audio(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(..., description="Audio file (mp3, wav, m4a, etc., max 25MB)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file must have a valid filename."
        )

    # Validate file extension
    file_ext = os.path.splitext(file.filename)[1].lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Unsupported file extension '{file_ext}'. "
                f"Supported formats: {', '.join(sorted(ALLOWED_EXTENSIONS))}"
            )
        )

    # Optional MIME type check if provided
    if file.content_type and file.content_type.lower() not in ALLOWED_MIME_TYPES and not file.content_type.startswith("audio/"):
        logger.warning(f"Uncommon content-type for upload: {file.content_type}")

    # Generate unique ID and target path
    meeting_id = str(uuid.uuid4())
    stored_filename = f"{meeting_id}{file_ext}"
    target_path = os.path.join(settings.STORAGE_DIR, stored_filename)

    max_bytes = settings.MAX_FILE_SIZE_MB * 1024 * 1024
    total_bytes = 0
    chunk_size = 1024 * 1024  # 1MB chunks

    try:
        with open(target_path, "wb") as buffer:
            while chunk := await file.read(chunk_size):
                total_bytes += len(chunk)
                if total_bytes > max_bytes:
                    buffer.close()
                    if os.path.exists(target_path):
                        os.remove(target_path)
                    raise HTTPException(
                        status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                        detail=f"File size exceeds maximum allowed limit of {settings.MAX_FILE_SIZE_MB}MB."
                    )
                buffer.write(chunk)
    except HTTPException:
        raise
    except Exception as exc:
        if os.path.exists(target_path):
            os.remove(target_path)
        logger.error(f"Failed to write uploaded file to disk: {exc}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Could not save uploaded audio file: {str(exc)}"
        )

    if total_bytes == 0:
        if os.path.exists(target_path):
            os.remove(target_path)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty (0 bytes)."
        )

    # Create meeting DB record
    meeting = Meeting(
        id=meeting_id,
        user_id=current_user.id,
        filename=file.filename,
        audio_path=target_path,
        file_size_bytes=total_bytes,
        status=MeetingStatus.PENDING.value
    )
    db.add(meeting)
    db.commit()
    db.refresh(meeting)

    # Update Redis cache
    update_meeting_cache(meeting.id, MeetingStatus.PENDING.value)

    # Dispatch background worker task
    background_tasks.add_task(process_meeting_audio, meeting.id)

    return MeetingUploadResponse(
        id=meeting.id,
        filename=meeting.filename,
        status=meeting.status,
        message="Audio file uploaded successfully. Processing initiated.",
        created_at=meeting.created_at
    )
