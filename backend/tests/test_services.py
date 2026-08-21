import os
import tempfile
import pytest
from app.services.asr_service import transcribe_audio
from app.services.llm_service import summarize_transcript, get_mock_summary
from app.services.processor import process_meeting_audio
from app.models import Meeting, MeetingStatus


def test_asr_service_mock():
    """Test ASR service returns mock transcript when mock mode is enabled."""
    with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as tmp:
        tmp.write(b"fake audio stream")
        tmp_path = tmp.name

    try:
        transcript = transcribe_audio(tmp_path)
        assert isinstance(transcript, str)
        assert "Meeting Transcript" in transcript
        assert len(transcript) > 50
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)


def test_asr_service_file_not_found():
    """Test ASR service raises FileNotFoundError if audio path does not exist."""
    with pytest.raises(FileNotFoundError):
        transcribe_audio("/non/existent/path/meeting.mp3")


def test_llm_service_mock_summary():
    """Test LLM service produces structured summary conforming to exact schema."""
    sample_transcript = "Alice: Let's launch feature X by Friday. Bob: I will handle the deployment."
    result = summarize_transcript(sample_transcript)
    
    assert result.summary is not None
    assert isinstance(result.key_decisions, list)
    assert len(result.key_decisions) >= 1
    assert isinstance(result.action_items, list)
    assert len(result.action_items) >= 1
    assert hasattr(result.action_items[0], "task")
    assert hasattr(result.action_items[0], "owner")
    assert hasattr(result.action_items[0], "deadline")


def test_llm_service_empty_transcript_error():
    """Test LLM service raises ValueError for empty transcript."""
    with pytest.raises(ValueError):
        summarize_transcript("")


def test_end_to_end_processor_pipeline(db_session):
    """Test background processor executes complete pipeline: pending -> transcribing -> summarizing -> done."""
    with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as tmp:
        tmp.write(b"fake audio data")
        tmp_path = tmp.name

    meeting_id = "test-proc-" + os.path.basename(tmp_path)
    meeting = Meeting(
        id=meeting_id,
        filename="pipeline_test.mp3",
        audio_path=tmp_path,
        file_size_bytes=100,
        status=MeetingStatus.PENDING.value
    )
    db_session.add(meeting)
    db_session.commit()

    try:
        # Run background processor synchronously
        process_meeting_audio(meeting_id)

        # Refresh meeting record from DB
        refreshed = db_session.query(Meeting).filter(Meeting.id == meeting_id).first()
        assert refreshed.status == MeetingStatus.DONE.value
        assert refreshed.transcript is not None
        assert refreshed.summary is not None
        assert isinstance(refreshed.key_decisions, list)
        assert isinstance(refreshed.action_items, list)
        assert refreshed.error_message is None
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)
