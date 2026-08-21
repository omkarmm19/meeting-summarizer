import os
import sys
import tempfile
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# Ensure SQLite in-memory with StaticPool and mock services for test suite
os.environ["DATABASE_URL"] = "sqlite:///:memory:"
os.environ["MOCK_SERVICES"] = "true"
os.environ["REDIS_URL"] = "redis://localhost:6379/0"

# Add backend directory to sys.path
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.config import settings
import app.database as app_db
import app.services.processor as app_processor
from app.models import Base
from app.main import app

# Set test storage directory
test_storage_dir = tempfile.mkdtemp(prefix="meetlytic_test_storage_")
settings.STORAGE_DIR = test_storage_dir

# Use StaticPool so all threads/sessions share the exact same in-memory SQLite database
engine_test = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine_test)

# Bind test session to app modules
app_db.engine = engine_test
app_db.SessionLocal = TestingSessionLocal
app_processor.SessionLocal = TestingSessionLocal


@pytest.fixture(scope="session", autouse=True)
def setup_test_environment():
    """Create all tables before test run, drop after."""
    Base.metadata.create_all(bind=engine_test)
    yield
    Base.metadata.drop_all(bind=engine_test)


@pytest.fixture
def db_session():
    """Provides a transactional database session for tests."""
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def client():
    """FastAPI TestClient with overridden get_db dependency."""
    def override_get_db():
        session = TestingSessionLocal()
        try:
            yield session
        finally:
            session.close()

    app.dependency_overrides[app_db.get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def auth_user_a(db_session):
    """Creates Test User A and returns user and auth headers."""
    from app.models import User
    from app.services.auth_service import hash_password, create_access_token
    import uuid

    uid = uuid.uuid4().hex[:8]
    user = User(
        id=str(uuid.uuid4()),
        email=f"alice_{uid}@example.com",
        hashed_password=hash_password("password123"),
        full_name="Alice User"
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    token = create_access_token({"sub": user.id, "email": user.email})
    headers = {"Authorization": f"Bearer {token}"}
    return {"user": user, "headers": headers, "token": token}


@pytest.fixture
def auth_user_b(db_session):
    """Creates Test User B and returns user and auth headers for tenant isolation testing."""
    from app.models import User
    from app.services.auth_service import hash_password, create_access_token
    import uuid

    uid = uuid.uuid4().hex[:8]
    user = User(
        id=str(uuid.uuid4()),
        email=f"bob_{uid}@example.com",
        hashed_password=hash_password("password456"),
        full_name="Bob User"
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    token = create_access_token({"sub": user.id, "email": user.email})
    headers = {"Authorization": f"Bearer {token}"}
    return {"user": user, "headers": headers, "token": token}
