import json
from typing import Any

import redis

from app.application.ports.cache_service import CacheService
from app.infrastructure.config.logging import logger
from app.infrastructure.config.settings import settings


class RedisCacheService(CacheService):
    def __init__(self, url: str | None = None):
        self.url = url or settings.REDIS_URL
        try:
            self.client = redis.from_url(self.url, decode_responses=True)
        except Exception as e:
            logger.warning("Redis connection failed: %s. Cache will be disabled.", e)
            self.client = None

    def get(self, key: str) -> Any | None:
        if not self.client:
            return None
        try:
            data = self.client.get(key)
            return json.loads(data) if data else None
        except Exception as e:
            logger.exception("Redis get failed for key %s: %s", key, e)
            return None

    def set(self, key: str, value: Any, expire_seconds: int = 300) -> None:
        if not self.client:
            return
        try:
            self.client.setex(key, expire_seconds, json.dumps(value, default=str))
        except Exception as e:
            logger.exception("Redis set failed for key %s: %s", key, e)

    def delete(self, key: str) -> None:
        if not self.client:
            return
        try:
            self.client.delete(key)
        except Exception as e:
            logger.exception("Redis delete failed for key %s: %s", key, e)

    def delete_by_prefix(self, prefix: str) -> None:
        if not self.client:
            return
        try:
            pattern = f"{prefix}*"
            keys = list(self.client.scan_iter(match=pattern))
            if keys:
                self.client.delete(*keys)
        except Exception as e:
            logger.exception("Redis delete_by_prefix failed for prefix %s: %s", prefix, e)
