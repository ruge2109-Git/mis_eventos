import json
import redis
from typing import Any, Optional
from app.application.ports.cache_service import CacheService
from app.infrastructure.config.settings import settings

class RedisCacheService(CacheService):
    def __init__(self, url: Optional[str] = None):
        self.url = url or settings.REDIS_URL
        try:
            self.client = redis.from_url(self.url, decode_responses=True)
        except Exception:
            self.client = None

    def get(self, key: str) -> Optional[Any]:
        if not self.client: return None
        try:
            data = self.client.get(key)
            return json.loads(data) if data else None
        except Exception:
            return None

    def set(self, key: str, value: Any, expire_seconds: int = 300) -> None:
        if not self.client: return
        try:
            self.client.setex(key, expire_seconds, json.dumps(value, default=str))
        except Exception:
            pass

    def delete(self, key: str) -> None:
        if not self.client: return
        try:
            self.client.delete(key)
        except Exception:
            pass
