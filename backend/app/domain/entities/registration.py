from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional

@dataclass
class Registration:
    user_id: int
    event_id: int
    id: Optional[int] = None
    registration_date: datetime = field(default_factory=datetime.utcnow)
