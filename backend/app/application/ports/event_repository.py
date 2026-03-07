"""EventRepository = EventReader + EventWriter (ISP)."""
from abc import ABC, abstractmethod
from datetime import datetime

from app.application.dto.event_with_organizer import EventWithOrganizer
from app.application.ports.event_reader import EventReader
from app.application.ports.event_writer import EventWriter
from app.domain.entities.event import Event


class EventRepository(EventReader, EventWriter, ABC):
    """Full event persistence: read + write. Implementations satisfy both interfaces."""

    @abstractmethod
    def save(self, event: Event) -> Event:
        pass

    @abstractmethod
    def get_by_id(self, event_id: int) -> Event | None:
        pass

    @abstractmethod
    def get_by_ids(self, event_ids: list[int]) -> list[Event]:
        """Return events for the given IDs, in arbitrary order. Skips missing IDs."""
        pass

    @abstractmethod
    def list_all(
        self,
        skip: int = 0,
        limit: int = 100,
        search: str | None = None,
        status: str | None = None,
        organizer_id: int | None = None,
    ) -> tuple[list[Event], int]:
        pass

    @abstractmethod
    def find_overlapping(
        self, start_date: datetime, end_date: datetime, exclude_id: int | None = None
    ) -> list[Event]:
        pass

    @abstractmethod
    def delete(self, event_id: int) -> None:
        pass

    @abstractmethod
    def list_all_with_organizer(
        self,
        skip: int = 0,
        limit: int = 100,
        search: str | None = None,
        status: str | None = None,
        organizer_id: int | None = None,
    ) -> tuple[list[EventWithOrganizer], int]:
        """List events with organizer email and full_name in one query (JOIN). For admin."""
        pass

    @abstractmethod
    def list_upcoming(
        self, skip: int = 0, limit: int = 10, search: str | None = None
    ) -> tuple[list[Event], int]:
        """List published events with start_date >= now, optional search on title; return (items, total)."""
        pass
