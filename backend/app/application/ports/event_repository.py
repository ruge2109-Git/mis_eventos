from abc import ABC, abstractmethod
from datetime import datetime

from app.domain.entities.event import Event


class EventRepository(ABC):
    @abstractmethod
    def save(self, event: Event) -> Event:
        pass

    @abstractmethod
    def get_by_id(self, event_id: int) -> Event | None:
        pass

    @abstractmethod
    def list_all(
        self, skip: int = 0, limit: int = 100, search: str | None = None, status: str | None = None
    ) -> tuple[list[Event], int]:
        pass

    @abstractmethod
    def find_overlapping(
        self, start_date: datetime, end_date: datetime, exclude_id: int | None = None
    ) -> list[Event]:
        """Finds any event that overlaps with the given time range."""
        pass

    @abstractmethod
    def delete(self, event_id: int) -> None:
        pass
