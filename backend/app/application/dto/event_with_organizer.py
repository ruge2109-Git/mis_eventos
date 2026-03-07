"""DTO for admin event list: event plus organizer display info (single query)."""
from dataclasses import dataclass

from app.domain.entities.event import Event


@dataclass
class EventWithOrganizer:
    event: Event
    organizer_email: str
    organizer_full_name: str
