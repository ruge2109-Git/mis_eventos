from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional

class EventStatus:
    DRAFT = "Draft"
    PUBLISHED = "Published"
    CANCELLED = "Cancelled"
    FINISHED = "Finished"

@dataclass
class Event:
    title: str
    capacity: int
    start_date: datetime
    end_date: datetime
    organizer_id: int
    location: Optional[str] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    status: str = EventStatus.DRAFT
    id: Optional[int] = None

    def publish(self):
        self.status = EventStatus.PUBLISHED
        
    def cancel(self):
        self.status = EventStatus.CANCELLED
        
    def is_active(self) -> bool:
        return self.status == EventStatus.PUBLISHED and self.end_date > datetime.utcnow()

    def overlaps_with(self, other_event: "Event") -> bool:
        return max(self.start_date, other_event.start_date) < min(self.end_date, other_event.end_date)
    
    def same_location(self, other_event: "Event") -> bool:
        if not self.location or not other_event.location:
            return False
        return self.location.lower().strip() == other_event.location.lower().strip()
