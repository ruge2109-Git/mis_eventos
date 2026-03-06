from dataclasses import dataclass
from datetime import datetime
from typing import Optional

@dataclass
class Session:
    title: str
    start_time: datetime
    end_time: datetime
    speaker: str
    capacity: int
    event_id: int
    description: Optional[str] = None
    id: Optional[int] = None
    
    def overlaps_with(self, other_session: "Session") -> bool:
        return max(self.start_time, other_session.start_time) < min(self.end_time, other_session.end_time)
