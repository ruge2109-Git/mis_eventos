from dataclasses import dataclass
from datetime import datetime


@dataclass
class SessionRegistration:
    user_id: int
    session_id: int
    registration_date: datetime = datetime.utcnow()
    id: int | None = None
