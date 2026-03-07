from dataclasses import dataclass, field
from datetime import datetime


@dataclass
class Registration:
    user_id: int
    event_id: int
    id: int | None = None
    registration_date: datetime = field(default_factory=datetime.utcnow)


@dataclass
class EventAttendee:
    """Attendee info for organizer view: registration + user display data."""

    id: int  # registration id
    user_id: int
    full_name: str
    email: str
    registration_date: datetime
