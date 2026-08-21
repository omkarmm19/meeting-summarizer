import json
import logging
from typing import Optional, Dict, Any
import redis
from app.config import settings

logger = logging.getLogger(__name__)

_redis_client: Optional[redis.Redis] = None


def get_redis_client() -> Optional[redis.Redis]:
    """Returns singleton Redis client instance, or None if unreachable."""
    global _redis_client
    if _redis_client is None:
        try:
            _redis_client = redis.Redis.from_url(
                settings.REDIS_URL,
                decode_responses=True,
                socket_connect_timeout=2,
                socket_timeout=2
            )
            # Test connection
            _redis_client.ping()
        except Exception as exc:
            logger.warning(f"Redis not available ({str(exc)}). Continuing without cache.")
            _redis_client = None
    return _redis_client


def update_meeting_cache(meeting_id: str, status: str, error_message: Optional[str] = None, ttl_seconds: int = 3600):
    """Caches meeting processing status in Redis."""
    try:
        client = get_redis_client()
        if client:
            payload = {
                "status": status,
                "error_message": error_message
            }
            client.setex(f"meeting:{meeting_id}:status", ttl_seconds, json.dumps(payload))
            # Publish event to status channel for real-time subscribers if any
            client.publish(f"meeting:{meeting_id}:events", json.dumps(payload))
    except Exception as exc:
        logger.warning(f"Failed to update Redis cache for meeting {meeting_id}: {exc}")


def get_cached_meeting_status(meeting_id: str) -> Optional[Dict[str, Any]]:
    """Retrieves cached status from Redis if present."""
    try:
        client = get_redis_client()
        if client:
            raw = client.get(f"meeting:{meeting_id}:status")
            if raw:
                return json.loads(raw)
    except Exception as exc:
        logger.warning(f"Failed to fetch Redis cache for meeting {meeting_id}: {exc}")
    return None


def ping_redis() -> bool:
    """Returns True if Redis is healthy."""
    try:
        client = get_redis_client()
        if client:
            return client.ping()
    except Exception:
        return False
    return False
