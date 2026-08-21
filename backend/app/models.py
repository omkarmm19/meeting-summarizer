import uuid
from enum import Enum as PyEnum
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, DateTime, JSON, BigInteger
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from app.database import Base


class MeetingStatus(str, PyEnum):
    PENDING = "pending"
    TRANSCRIBING = "transcribing"
    SUMMARIZING = "summarizing"
    DONE = "done"
    FAILED = "failed"


class Meeting(Base):
    __tablename__ = "meetings"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    filename = Column(String(255), nullable=False)
    audio_path = Column(String(512), nullable=False)
    file_size_bytes = Column(BigInteger, nullable=False, default=0)
    status = Column(String(32), nullable=False, default=MeetingStatus.PENDING.value, index=True)
    
    transcript = Column(Text, nullable=True)
    summary = Column(Text, nullable=True)
    key_decisions = Column(JSON, nullable=True)
    action_items = Column(JSON, nullable=True)
    error_message = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False
    )
