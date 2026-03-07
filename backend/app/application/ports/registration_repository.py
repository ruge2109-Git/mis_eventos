from abc import ABC, abstractmethod
from typing import TYPE_CHECKING

from app.domain.entities.registration import EventAttendee, Registration

if TYPE_CHECKING:
    from app.domain.entities.event import Event


class RegistrationRepository(ABC):
    @abstractmethod
    def save(self, registration: Registration) -> Registration:
        pass

    @abstractmethod
    def get_by_user_and_event(self, user_id: int, event_id: int) -> Registration | None:
        pass

    @abstractmethod
    def list_by_user(self, user_id: int) -> list[Registration]:
        pass

    @abstractmethod
    def list_by_event(self, event_id: int) -> list[Registration]:
        pass

    @abstractmethod
    def get_count_by_event(self, event_id: int) -> int:
        pass

    @abstractmethod
    def get_counts_by_event_ids(self, event_ids: list[int]) -> dict[int, int]:
        pass

    @abstractmethod
    def delete(self, registration_id: int) -> None:
        pass

    @abstractmethod
    def list_attendees_by_event(
        self, event_id: int, skip: int = 0, limit: int = 10, search: str | None = None
    ) -> tuple[list[EventAttendee], int]:
        """Return (attendees page, total count) for an event. Optional search on user full_name/email."""
        pass

    @abstractmethod
    def get_top_users_by_registrations(
        self, skip: int = 0, limit: int = 10, search: str | None = None
    ) -> tuple[list[tuple[int, str, str, int]], int]:
        """Return (list of (user_id, full_name, email, registration_count), total) ordered by count desc."""
        pass

    @abstractmethod
    def list_registered_events_paginated(
        self, user_id: int, skip: int = 0, limit: int = 10, search: str | None = None
    ) -> tuple[list["Event"], int]:
        """Events the user is registered for; (items, total) with optional search on event title."""
        pass
