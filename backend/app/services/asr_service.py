import os
import logging
from openai import OpenAI
from groq import Groq
from app.config import settings

logger = logging.getLogger(__name__)


def transcribe_audio(audio_path: str) -> str:
    """
    Transcribe audio file using OpenAI Whisper API.
    If OpenAI quota is unavailable and Groq key is present, falls back to Groq Whisper.
    Falls back to mock transcription when MOCK_SERVICES is True or no valid API key is present.
    """
    if not os.path.exists(audio_path):
        raise FileNotFoundError(f"Audio file not found at path: {audio_path}")

    openai_key = settings.OPENAI_API_KEY.strip() if settings.OPENAI_API_KEY else ""
    groq_key = settings.GROQ_API_KEY.strip() if settings.GROQ_API_KEY else ""

    is_dummy_openai = not openai_key or openai_key.startswith("your_") or openai_key == "sk-dummy"
    is_dummy_groq = not groq_key or groq_key.startswith("your_") or groq_key == "gsk_dummy"

    # If mock services explicitly enabled or no keys present at all
    if settings.MOCK_SERVICES or (is_dummy_openai and is_dummy_groq):
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

    # 1. Primary: Try OpenAI Whisper API
    if not is_dummy_openai:
        try:
            client = OpenAI(api_key=openai_key)
            with open(audio_path, "rb") as audio_file:
                logger.info(f"Submitting audio file to OpenAI Whisper API: {audio_path}")
                transcript_response = client.audio.transcriptions.create(
                    model="whisper-1",
                    file=audio_file,
                    response_format="text"
                )
                if isinstance(transcript_response, str):
                    return transcript_response
                return getattr(transcript_response, "text", str(transcript_response))
        except Exception as exc:
            logger.warning(f"OpenAI Whisper API call failed ({exc}). Checking fallback...")
            if is_dummy_groq:
                raise RuntimeError(f"OpenAI Whisper failed: {str(exc)}") from exc

    # 2. Resilient Fallback: Groq Whisper API
    if not is_dummy_groq:
        try:
            logger.info("Transcribing via Groq Whisper API (whisper-large-v3)...")
            groq_client = Groq(api_key=groq_key)
            with open(audio_path, "rb") as audio_file:
                transcription = groq_client.audio.transcriptions.create(
                    model="whisper-large-v3",
                    file=audio_file,
                    response_format="text"
                )
                if isinstance(transcription, str):
                    return transcription
                return getattr(transcription, "text", str(transcription))
        except Exception as groq_exc:
            logger.error(f"Groq Whisper transcription failed: {groq_exc}", exc_info=True)
            raise RuntimeError(f"Whisper transcription failed: {str(groq_exc)}") from groq_exc

    raise RuntimeError("No valid API key available for speech transcription.")
