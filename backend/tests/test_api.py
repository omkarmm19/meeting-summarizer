import io
import uuid
import pytest
from app.models import Meeting, MeetingStatus


def test_health_check(client):
    """Test health endpoint returns 200 and healthy DB/Redis status."""
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] in ["ok", "degraded"]
    assert "database" in data
    assert "redis" in data


def test_upload_valid_audio(client, db_session):
    """Test uploading a valid audio file triggers background processing and returns 201."""
    fake_audio_content = b"ID3\x03\x00\x00\x00\x00\x00#TSSE\x00\x00\x00\x0f\x00\x00\x00Lavf58.29.100\x00" + b"\x00" * 500
    file = io.BytesIO(fake_audio_content)

    response = client.post(
        "/api/meetings/upload",
        files={"file": ("team_sync.mp3", file, "audio/mpeg")}
    )

    assert response.status_code == 201
    data = response.json()
    assert "id" in data
    assert data["filename"] == "team_sync.mp3"
    assert data["status"] == "pending"

    meeting_id = data["id"]

    # Verify meeting exists in DB
    meeting = db_session.query(Meeting).filter(Meeting.id == meeting_id).first()
    assert meeting is not None
    assert meeting.filename == "team_sync.mp3"


def test_upload_invalid_file_extension(client):
    """Test uploading an unsupported extension is rejected with 400 Bad Request."""
    file = io.BytesIO(b"fake text content")
    response = client.post(
        "/api/meetings/upload",
        files={"file": ("notes.txt", file, "text/plain")}
    )
    assert response.status_code == 400
    assert "Unsupported file extension" in response.json()["detail"]


def test_upload_empty_file(client):
    """Test uploading an empty file is rejected with 400 Bad Request."""
    file = io.BytesIO(b"")
    response = client.post(
        "/api/meetings/upload",
        files={"file": ("empty.wav", file, "audio/wav")}
    )
    assert response.status_code == 400
    assert "empty" in response.json()["detail"].lower()


def test_list_meetings(client, db_session):
    """Test listing all meetings endpoint."""
    # Create sample meeting
    meeting = Meeting(
        id=str(uuid.uuid4()),
        filename="standup.mp3",
        audio_path="/fake/path.mp3",
        file_size_bytes=1024,
        status=MeetingStatus.DONE.value,
        summary="Sprint standup completed successfully."
    )
    db_session.add(meeting)
    db_session.commit()

    response = client.get("/api/meetings")
    assert response.status_code == 200
    items = response.json()
    assert isinstance(items, list)
    assert len(items) >= 1
    assert any(m["id"] == meeting.id for m in items)


def test_get_meeting_detail(client, db_session):
    """Test fetching details of a specific meeting."""
    meeting_id = str(uuid.uuid4())
    meeting = Meeting(
        id=meeting_id,
        filename="quarterly_review.mp3",
        audio_path="/fake/audio.mp3",
        file_size_bytes=4096,
        status=MeetingStatus.DONE.value,
        transcript="Discussed Q4 roadmap and hiring plan.",
        summary="Overview of Q4 deliverables and hiring milestones.",
        key_decisions=["Hire 2 backend engineers", "Freeze frontend major refactors"],
        action_items=[{"task": "Post job descriptions", "owner": "Alice", "deadline": "Friday"}]
    )
    db_session.add(meeting)
    db_session.commit()

    response = client.get(f"/api/meetings/{meeting_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == meeting_id
    assert data["status"] == "done"
    assert data["summary"] == meeting.summary
    assert len(data["key_decisions"]) == 2
    assert len(data["action_items"]) == 1
    assert data["action_items"][0]["owner"] == "Alice"


def test_get_meeting_not_found(client):
    """Test fetching non-existent meeting returns 404."""
    non_existent_id = str(uuid.uuid4())
    response = client.get(f"/api/meetings/{non_existent_id}")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


def test_delete_meeting(client, db_session):
    """Test deleting a meeting record."""
    meeting_id = str(uuid.uuid4())
    meeting = Meeting(
        id=meeting_id,
        filename="delete_test.mp3",
        audio_path="/fake/non_existent.mp3",
        file_size_bytes=2048,
        status=MeetingStatus.PENDING.value
    )
    db_session.add(meeting)
    db_session.commit()

    response = client.delete(f"/api/meetings/{meeting_id}")
    assert response.status_code == 200
    assert "deleted successfully" in response.json()["message"].lower()

    # Confirm deletion from DB
    deleted = db_session.query(Meeting).filter(Meeting.id == meeting_id).first()
    assert deleted is None
