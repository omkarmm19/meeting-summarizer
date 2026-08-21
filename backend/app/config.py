import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List

# Base backend directory (always absolute, regardless of CWD)
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DEFAULT_STORAGE_DIR = os.path.join(BASE_DIR, "storage", "audio")

# Resolve .env file path - check backend dir first, then project root
_backend_env = os.path.join(BASE_DIR, ".env")
_root_env = os.path.join(os.path.dirname(BASE_DIR), ".env")
_env_file = _backend_env if os.path.exists(_backend_env) else _root_env


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/meetings_db"
    REDIS_URL: str = "redis://localhost:6379/0"

    OPENAI_API_KEY: str = ""
    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "llama-3.3-70b-versatile"

    STORAGE_DIR: str = DEFAULT_STORAGE_DIR
    MAX_FILE_SIZE_MB: int = 25
    MOCK_SERVICES: bool = False

    CORS_ORIGINS: str = "http://localhost,http://localhost:5173,http://localhost:80,http://localhost:3000"

    model_config = SettingsConfigDict(
        env_file=_env_file,
        env_file_encoding="utf-8",
        extra="ignore"
    )

    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]


settings = Settings()

# Force STORAGE_DIR to absolute path - if relative, resolve from backend base dir
if not os.path.isabs(settings.STORAGE_DIR):
    settings.STORAGE_DIR = os.path.join(BASE_DIR, "storage", "audio")

# Ensure local storage directory exists
os.makedirs(settings.STORAGE_DIR, exist_ok=True)
