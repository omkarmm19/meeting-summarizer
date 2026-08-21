import io
import uuid
import pytest
from app.models import Meeting, MeetingStatus


def test_auth_signup_and_me(client):
    """Test user registration and fetching profile."""
    signup_data = {
        "email": "newuser@example.com",
        "password": "secretpassword123",
        "full_name": "New User"
    }
    res = client.post("/api/auth/signup", json=signup_data)
    assert res.status_code == 201
    data = res.json()
    assert "access_token" in data
    assert data["user"]["email"] == "newuser@example.com"
    assert data["user"]["full_name"] == "New User"

    # Test /api/auth/me with token
    token = data["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    me_res = client.get("/api/auth/me", headers=headers)
    assert me_res.status_code == 200
    assert me_res.json()["email"] == "newuser@example.com"


def test_auth_signup_duplicate_email(client):
    """Test registering with an existing email is rejected."""
    signup_data = {
        "email": "duplicate@example.com",
        "password": "password123",
        "full_name": "Dup User"
    }
    res1 = client.post("/api/auth/signup", json=signup_data)
    assert res1.status_code == 201

    res2 = client.post("/api/auth/signup", json=signup_data)
    assert res2.status_code == 400
    assert "already exists" in res2.json()["detail"].lower()


def test_auth_login_success_and_failure(client):
    """Test user login with valid and invalid credentials."""
    signup_data = {
        "email": "loginuser@example.com",
        "password": "correctpassword",
        "full_name": "Login User"
    }
    client.post("/api/auth/signup", json=signup_data)

    # Valid login
    login_res = client.post("/api/auth/login", json={
        "email": "loginuser@example.com",
        "password": "correctpassword"
    })
    assert login_res.status_code == 200
    assert "access_token" in login_res.json()

    # Invalid password
    bad_pwd_res = client.post("/api/auth/login", json={
        "email": "loginuser@example.com",
        "password": "wrongpassword"
    })
    assert bad_pwd_res.status_code == 401
    assert "invalid email or password" in bad_pwd_res.json()["detail"].lower()


def test_unauthenticated_request_rejected(client):
    """Test protected routes reject unauthenticated requests."""
    res = client.get("/api/meetings")
    assert res.status_code == 401

    res = client.get("/api/meetings/12345")
    assert res.status_code == 401


def test_user_tenant_isolation(client, db_session, auth_user_a, auth_user_b):
    """
    CRITICAL SECURITY TEST:
    Verify User A and User B have complete data isolation.
    User A cannot list, view, stream or delete User B's meetings.
    """
    # Create meeting belonging to User A
    meeting_a = Meeting(
        id=str(uuid.uuid4()),
        user_id=auth_user_a["user"].id,
        filename="alice_confidential.mp3",
        audio_path="/fake/alice.mp3",
        file_size_bytes=1000,
        status=MeetingStatus.DONE.value,
        summary="Alice private meeting summary"
    )
    db_session.add(meeting_a)

    # Create meeting belonging to User B
    meeting_b = Meeting(
        id=str(uuid.uuid4()),
        user_id=auth_user_b["user"].id,
        filename="bob_confidential.mp3",
        audio_path="/fake/bob.mp3",
        file_size_bytes=2000,
        status=MeetingStatus.DONE.value,
        summary="Bob private meeting summary"
    )
    db_session.add(meeting_b)
    db_session.commit()

    # 1. User A lists meetings -> sees only meeting_a
    res_a = client.get("/api/meetings", headers=auth_user_a["headers"])
    assert res_a.status_code == 200
    items_a = res_a.json()
    assert any(m["id"] == meeting_a.id for m in items_a)
    assert not any(m["id"] == meeting_b.id for m in items_a)

    # 2. User B lists meetings -> sees only meeting_b
    res_b = client.get("/api/meetings", headers=auth_user_b["headers"])
    assert res_b.status_code == 200
    items_b = res_b.json()
    assert any(m["id"] == meeting_b.id for m in items_b)
    assert not any(m["id"] == meeting_a.id for m in items_b)

    # 3. User A tries to access User B's meeting detail -> 404
    cross_res = client.get(f"/api/meetings/{meeting_b.id}", headers=auth_user_a["headers"])
    assert cross_res.status_code == 404

    # 4. User A tries to delete User B's meeting -> 404
    delete_cross_res = client.delete(f"/api/meetings/{meeting_b.id}", headers=auth_user_a["headers"])
    assert delete_cross_res.status_code == 404

    # Verify meeting_b is still intact in DB
    still_exists = db_session.query(Meeting).filter(Meeting.id == meeting_b.id).first()
    assert still_exists is not None
