from pydantic import BaseModel, Field, ConfigDict, field_serializer
from typing import List, Optional
from datetime import datetime, timezone


class ActionItem(BaseModel):
    task: str = Field(..., description="Actionable task description")
    owner: Optional[str] = Field(None, description="Assigned owner or null if not specified")
    deadline: Optional[str] = Field(None, description="Deadline or null if not specified")


class MeetingStructuredSummary(BaseModel):
    summary: str = Field(..., description="A 3-4 sentence overview of the meeting")
    key_decisions: List[str] = Field(default_factory=list, description="Array of concrete decisions made")
    action_items: List[ActionItem] = Field(default_factory=list, description="Array of actionable tasks")


class MeetingUploadResponse(BaseModel):
    id: str
    filename: str
    status: str
    message: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

    @field_serializer("created_at")
    def serialize_created_at(self, dt: datetime, _info) -> str:
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt.isoformat()


class MeetingListItem(BaseModel):
    id: str
    filename: str
    status: str
    file_size_bytes: int
    summary: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

    @field_serializer("created_at", "updated_at")
    def serialize_dt(self, dt: datetime, _info) -> str:
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt.isoformat()


class MeetingDetail(BaseModel):
    id: str
    filename: str
    file_size_bytes: int
    status: str
    transcript: Optional[str] = None
    summary: Optional[str] = None
    key_decisions: Optional[List[str]] = None
    action_items: Optional[List[ActionItem]] = None
    error_message: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

    @field_serializer("created_at", "updated_at")
    def serialize_dt(self, dt: datetime, _info) -> str:
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt.isoformat()


class UserSignup(BaseModel):
    email: str = Field(..., description="User email address")
    password: str = Field(..., min_length=6, description="Password (min 6 characters)")
    full_name: Optional[str] = Field(None, description="User full name")


class UserLogin(BaseModel):
    email: str = Field(..., description="User email address")
    password: str = Field(..., description="User password")


class UserResponse(BaseModel):
    id: str
    email: str
    full_name: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

    @field_serializer("created_at")
    def serialize_created_at(self, dt: datetime, _info) -> str:
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt.isoformat()


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class HealthResponse(BaseModel):
    status: str
    database: str
    redis: str
