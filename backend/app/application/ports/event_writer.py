"""ISP: write interface for event persistence."""
from abc import ABC, abstractmethod

from app.domain.entities.event import Event


class EventWriter(ABC):
    @abstractmethod
    def save(self, event: Event) -> Event:
        pass

    @abstractmethod
    def delete(self, event_id: int) -> None:
        pass
