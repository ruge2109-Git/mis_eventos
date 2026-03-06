from abc import ABC, abstractmethod
from typing import Optional, List
from datetime import datetime
from app.domain.entities.event import Event

class EventRepository(ABC):
    @abstractmethod
    def save(self, event: Event) -> Event:
        pass

    @abstractmethod
    def get_by_id(self, event_id: int) -> Optional[Event]:
        pass

    @abstractmethod
    def list_all(self, skip: int = 0, limit: int = 100, search: Optional[str] = None) -> List[Event]:
        pass

    @abstractmethod
    def find_overlapping(self, start_date: datetime, end_date: datetime, exclude_id: Optional[int] = None) -> List[Event]:
        """Finds any event that overlaps with the given time range."""
        pass

    @abstractmethod
    def delete(self, event_id: int) -> None:
        pass
