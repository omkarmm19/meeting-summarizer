import os
import logging
from openai import OpenAI
from app.config import settings

logger = logging.getLogger(__name__)


def transcribe_audio(audio_path: str) -> str:
    """
    Transcribe audio file using OpenAI Whisper API.
    Falls back to mock transcription when MOCK_SERVICES is True or no valid API key is present.
    """
    if not os.path.exists(audio_path):
        raise FileNotFoundError(f"Audio file not found at path: {audio_path}")

    # Check if mock mode is active
    api_key = settings.OPENAI_API_KEY.strip() if settings.OPENAI_API_KEY else ""
    is_dummy_key = not api_key or api_key.startswith("your_") or api_key == "sk-dummy"
    
    if settings.MOCK_SERVICES or is_dummy_key:
        logger.info(f"[ASR Mock] Generating mock transcript for: {audio_path}")
        return (
            "Meeting Transcript - Q3 Product & Engineering Sync:\n\n"
            "Alex: Thanks everyone for joining today's sprint review and planning session. "
            "First on the agenda is our mobile app performance optimization. In the last sprint, "
            "we noticed a 40% latency spike on our checkout endpoints.\n\n"
            "Sarah: I investigated the issue with the database team. It turns out our indexing on "
            "the user transactions table was suboptimal. We should migrate the database queries "
            "to use a composite index on user_id and created_at. I can take ownership of this migration.\n\n"
            "Alex: Agreed. Let's make that our top priority. Sarah, please finish the database migration "
            "by this Friday.\n\n"
            "Michael: Regarding the UI redesign, the new design system components in Figma are ready. "
            "We decided to deprecate the legacy button components and switch to the unified Tailwind tokens. "
            "I will update the frontend design system by next Tuesday.\n\n"
            "Alex: Perfect. Also, we formally decided to adopt Redis for our distributed task queues and "
            "caching layer rather than running Celery with RabbitMQ. David, could you set up the Docker "
            "configuration and connection pooling for Redis by Wednesday?\n\n"
            "David: Sure thing, I will deliver the Redis infrastructure setup and documentation by Wednesday EOD.\n\n"
            "Alex: Excellent. Let's reconvene on Thursday for the mid-sprint check-in. Meeting adjourned."
        )

    try:
        client = OpenAI(api_key=api_key)
        with open(audio_path, "rb") as audio_file:
            logger.info(f"Submitting audio file to OpenAI Whisper API: {audio_path}")
            transcript_response = client.audio.transcriptions.create(
                model="whisper-1",
                file=audio_file,
                response_format="text"
            )
            
            # OpenAI Python SDK returns text directly when response_format="text" or Transcription object
            if isinstance(transcript_response, str):
                return transcript_response
            return getattr(transcript_response, "text", str(transcript_response))
            
    except Exception as exc:
        logger.error(f"Whisper transcription failed: {str(exc)}", exc_info=True)
        raise RuntimeError(f"Whisper API transcription error: {str(exc)}") from exc
