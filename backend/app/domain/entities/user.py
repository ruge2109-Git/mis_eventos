from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional
from enum import Enum

class UserRole(str, Enum):
    ADMIN = "Admin"
    ORGANIZER = "Organizer"
    ATTENDEE = "Attendee"

@dataclass
class User:
    email: str
    full_name: str
    hashed_password: str
    role: UserRole = UserRole.ATTENDEE
    id: Optional[int] = None
    created_at: datetime = field(default_factory=datetime.utcnow)

    def is_admin(self) -> bool:
        return self.role == UserRole.ADMIN

    def is_organizer(self) -> bool:
        return self.role == UserRole.ORGANIZER
