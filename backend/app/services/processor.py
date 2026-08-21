import logging
from datetime import datetime, timezone
from app.database import SessionLocal
from app.models import Meeting, MeetingStatus
from app.services.asr_service import transcribe_audio
from app.services.llm_service import summarize_transcript
from app.services.redis_service import update_meeting_cache

logger = logging.getLogger(__name__)


def process_meeting_audio(meeting_id: str):
    """
    Background pipeline executing speech transcription and LLM structured summarization.
    Flow: pending -> transcribing -> summarizing -> done (or failed).
    """
    db = SessionLocal()
    try:
        meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
        if not meeting:
            logger.error(f"Meeting {meeting_id} not found for background processing")
            return

        logger.info(f"Starting processing pipeline for meeting {meeting_id} ({meeting.filename})")

        # Step 1: Update status to TRANSCRIBING
        meeting.status = MeetingStatus.TRANSCRIBING.value
        meeting.updated_at = datetime.now(timezone.utc)
        db.commit()
        update_meeting_cache(meeting_id, MeetingStatus.TRANSCRIBING.value)

        # Step 2: Speech-to-Text via Whisper ASR
        logger.info(f"Transcribing audio file: {meeting.audio_path}")
        transcript = transcribe_audio(meeting.audio_path)
        
        meeting.transcript = transcript
        meeting.updated_at = datetime.now(timezone.utc)
        db.commit()

        # Step 3: Update status to SUMMARIZING
        meeting.status = MeetingStatus.SUMMARIZING.value
        meeting.updated_at = datetime.now(timezone.utc)
        db.commit()
        update_meeting_cache(meeting_id, MeetingStatus.SUMMARIZING.value)

        # Step 4: Structured Summary & Action Items via Groq LLM (JSON Mode)
        logger.info(f"Extracting structured summary with Groq LLM for meeting: {meeting_id}")
        structured_output = summarize_transcript(transcript)

        # Step 5: Save results and mark status as DONE
        meeting.summary = structured_output.summary
        meeting.key_decisions = structured_output.key_decisions
        meeting.action_items = [item.model_dump() for item in structured_output.action_items]
        meeting.status = MeetingStatus.DONE.value
        meeting.error_message = None
        meeting.updated_at = datetime.now(timezone.utc)
        db.commit()
        update_meeting_cache(meeting_id, MeetingStatus.DONE.value)

        logger.info(f"Successfully finished processing meeting {meeting_id}")

    except Exception as exc:
        error_msg = str(exc)
        logger.error(f"Processing failed for meeting {meeting_id}: {error_msg}", exc_info=True)
        try:
            meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
            if meeting:
                meeting.status = MeetingStatus.FAILED.value
                meeting.error_message = error_msg
                meeting.updated_at = datetime.now(timezone.utc)
                db.commit()
            update_meeting_cache(meeting_id, MeetingStatus.FAILED.value, error_message=error_msg)
        except Exception as db_exc:
            logger.error(f"Failed to record failure status in database: {db_exc}")

    finally:
        db.close()
