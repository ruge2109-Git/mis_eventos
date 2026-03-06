from abc import ABC, abstractmethod
from typing import Any, Optional

class CacheService(ABC):
    @abstractmethod
    def get(self, key: str) -> Optional[Any]:
        pass

    @abstractmethod
    def set(self, key: str, value: Any, expire_seconds: int = 300) -> None:
        pass

    @abstractmethod
    def delete(self, key: str) -> None:
        pass
