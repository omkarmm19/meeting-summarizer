import os
import logging
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker
from app.config import settings

logger = logging.getLogger("meetlytic.database")


def get_engine():
    db_url = settings.DATABASE_URL
    connect_args = {}

    if db_url.startswith("postgresql"):
        try:
            # Test PostgreSQL connectivity
            test_engine = create_engine(
                db_url,
                connect_args={"connect_timeout": 2},
                pool_pre_ping=True
            )
            with test_engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            logger.info("Successfully connected to PostgreSQL database.")
            return test_engine
        except Exception as exc:
            logger.warning(
                f"PostgreSQL connection to {db_url} failed ({exc}). "
                "Falling back to local SQLite database (meetings.db) for local standalone execution."
            )
            sqlite_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "meetings.db")
            db_url = f"sqlite:///{sqlite_path}"
            connect_args = {"check_same_thread": False}

    elif db_url.startswith("sqlite"):
        connect_args = {"check_same_thread": False}

    return create_engine(
        db_url,
        connect_args=connect_args,
        pool_pre_ping=True
    )


engine = get_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
