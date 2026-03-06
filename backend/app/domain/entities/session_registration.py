from dataclasses import dataclass
from datetime import datetime
from typing import Optional

@dataclass
class SessionRegistration:
    user_id: int
    session_id: int
    registration_date: datetime = datetime.utcnow()
    id: Optional[int] = None
