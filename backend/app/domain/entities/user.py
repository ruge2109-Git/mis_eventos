from dataclasses import dataclass, field
from datetime import UTC, datetime
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
    id: int | None = None
    created_at: datetime = field(default_factory=lambda: datetime.now(UTC))

    def is_admin(self) -> bool:
        return self.role == UserRole.ADMIN

    def is_organizer(self) -> bool:
        return self.role == UserRole.ORGANIZER

    def is_attendee(self) -> bool:
        return self.role == UserRole.ATTENDEE
