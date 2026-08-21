import os
import logging
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Meeting, User
from app.schemas import MeetingDetail, MeetingListItem
from app.services.redis_service import get_cached_meeting_status
from app.dependencies import get_current_user

router = APIRouter(prefix="/meetings", tags=["Meetings"])
logger = logging.getLogger(__name__)


@router.get(
    "",
    response_model=List[MeetingListItem],
    summary="List all meetings belonging to the authenticated user"
)
def list_meetings(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    meetings = (
        db.query(Meeting)
        .filter(Meeting.user_id == current_user.id)
        .order_by(Meeting.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return meetings


@router.get(
    "/{meeting_id}",
    response_model=MeetingDetail,
    summary="Retrieve details and analysis for a specific user meeting"
)
def get_meeting(
    meeting_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    meeting = (
        db.query(Meeting)
        .filter(Meeting.id == meeting_id, Meeting.user_id == current_user.id)
        .first()
    )
    if not meeting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Meeting with ID '{meeting_id}' not found."
        )

    # If meeting is still in-progress, inspect Redis for fast sync
    cached = get_cached_meeting_status(meeting_id)
    if cached and meeting.status in ["pending", "transcribing", "summarizing"]:
        if cached.get("status") and cached.get("status") != meeting.status:
            meeting.status = cached["status"]

    return meeting


@router.get(
    "/{meeting_id}/audio",
    summary="Stream raw meeting audio file for authenticated user playback"
)
def stream_meeting_audio(
    meeting_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    meeting = (
        db.query(Meeting)
        .filter(Meeting.id == meeting_id, Meeting.user_id == current_user.id)
        .first()
    )
    if not meeting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Meeting with ID '{meeting_id}' not found."
        )

    if not os.path.exists(meeting.audio_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Audio file not found on server storage."
        )

    file_ext = os.path.splitext(meeting.filename)[1].lower()
    media_type = "audio/mpeg"
    if file_ext in [".wav"]:
        media_type = "audio/wav"
    elif file_ext in [".m4a"]:
        media_type = "audio/mp4"
    elif file_ext in [".ogg", ".oga", ".opus"]:
        media_type = "audio/ogg"
    elif file_ext in [".webm"]:
        media_type = "audio/webm"

    return FileResponse(
        path=meeting.audio_path,
        media_type=media_type,
        filename=meeting.filename
    )


@router.delete(
    "/{meeting_id}",
    status_code=status.HTTP_200_OK,
    summary="Delete an authenticated user meeting and remove its audio file"
)
def delete_meeting(
    meeting_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    meeting = (
        db.query(Meeting)
        .filter(Meeting.id == meeting_id, Meeting.user_id == current_user.id)
        .first()
    )
    if not meeting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Meeting with ID '{meeting_id}' not found."
        )

    # Delete local audio file if exists
    if os.path.exists(meeting.audio_path):
        try:
            os.remove(meeting.audio_path)
        except Exception as exc:
            logger.warning(f"Could not delete audio file {meeting.audio_path}: {exc}")

    db.delete(meeting)
    db.commit()

    return {"message": f"Meeting {meeting_id} and associated audio deleted successfully."}
