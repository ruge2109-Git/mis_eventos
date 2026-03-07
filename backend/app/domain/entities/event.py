from dataclasses import dataclass, field
from datetime import UTC, datetime
from enum import Enum


class EventStatus(str, Enum):
    """API and domain event status. Use uppercase for consistent API contract."""
    DRAFT = "DRAFT"
    PUBLISHED = "PUBLISHED"
    CANCELLED = "CANCELLED"
    FINISHED = "FINISHED"


@dataclass
class Event:
    title: str
    capacity: int
    start_date: datetime
    end_date: datetime
    organizer_id: int
    location: str | None = None
    description: str | None = None
    image_url: str | None = None
    additional_images: list[str] = field(default_factory=list)
    status: str = EventStatus.DRAFT.value
    id: int | None = None

    def publish(self):
        self.status = EventStatus.PUBLISHED.value

    def cancel(self):
        self.status = EventStatus.CANCELLED.value

    def revert_to_draft(self):
        self.status = EventStatus.DRAFT.value

    def is_active(self, now: datetime | None = None) -> bool:
        if now is None:
            now = datetime.now(UTC).replace(tzinfo=None)
        return self.status == EventStatus.PUBLISHED.value and self.end_date > now

    def overlaps_with(self, other_event: "Event") -> bool:
        return max(self.start_date, other_event.start_date) < min(
            self.end_date, other_event.end_date
        )

    def same_location(self, other_event: "Event") -> bool:
        if not self.location or not other_event.location:
            return False
        return self.location.lower().strip() == other_event.location.lower().strip()
