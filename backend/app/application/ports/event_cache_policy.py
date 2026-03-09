from abc import ABC, abstractmethod


class EventCachePolicy(ABC):
    @abstractmethod
    def event_key(self, event_id: int) -> str:
        pass

    @abstractmethod
    def event_ttl_seconds(self) -> int:
        pass

    @abstractmethod
    def list_key(
        self,
        skip: int,
        limit: int,
        search: str | None,
        status: str | None,
        organizer_id: int | None,
    ) -> str:
        pass

    @abstractmethod
    def list_ttl_seconds(self) -> int:
        pass

    @abstractmethod
    def list_invalidation_prefix(self) -> str:
        pass
