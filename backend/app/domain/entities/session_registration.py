from dataclasses import dataclass, field
from datetime import UTC, datetime


@dataclass
class SessionRegistration:
    user_id: int
    session_id: int
    registration_date: datetime = field(default_factory=lambda: datetime.now(UTC))
    id: int | None = None
