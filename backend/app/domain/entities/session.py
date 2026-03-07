from dataclasses import dataclass
from datetime import datetime


@dataclass
class Session:
    title: str
    start_time: datetime
    end_time: datetime
    speaker: str
    event_id: int
    description: str | None = None
    id: int | None = None

    def overlaps_with(self, other_session: "Session") -> bool:
        return max(self.start_time, other_session.start_time) < min(
            self.end_time, other_session.end_time
        )
