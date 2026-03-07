"""Null Object implementation of CacheService. No-op for all operations."""

from typing import Any

from app.application.ports.cache_service import CacheService


class NoOpCacheService(CacheService):
    """Cache that does nothing. Use when caching is disabled or in tests."""

    def get(self, key: str) -> Any | None:
        return None

    def set(self, key: str, value: Any, expire_seconds: int = 300) -> None:
        pass

    def delete(self, key: str) -> None:
        pass

    def delete_by_prefix(self, prefix: str) -> None:
        pass
