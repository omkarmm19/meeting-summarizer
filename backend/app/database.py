import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from app.config import settings

def get_engine():
    connect_args = {}
    db_url = settings.DATABASE_URL
    if db_url.startswith("sqlite"):
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
