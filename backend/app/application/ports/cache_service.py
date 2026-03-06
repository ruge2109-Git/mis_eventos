from abc import ABC, abstractmethod
from typing import Any


class CacheService(ABC):
    @abstractmethod
    def get(self, key: str) -> Any | None:
        pass

    @abstractmethod
    def set(self, key: str, value: Any, expire_seconds: int = 300) -> None:
        pass

    @abstractmethod
    def delete(self, key: str) -> None:
        pass
