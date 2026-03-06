from datetime import datetime
from typing import TYPE_CHECKING

from sqlmodel import Field, Relationship, SQLModel

from app.domain.entities.user import User as DomainUser

if TYPE_CHECKING:
    from .event_model import EventModel
    from .registration_model import RegistrationModel
    from .session_registration_model import SessionRegistrationModel


class UserModel(SQLModel, table=True):
    __tablename__ = "users"
    id: int | None = Field(default=None, primary_key=True)
    email: str = Field(unique=True, index=True)
    full_name: str
    hashed_password: str
    role: str
    created_at: datetime

    events: list["EventModel"] = Relationship(back_populates="organizer")
    registrations: list["RegistrationModel"] = Relationship(back_populates="user")
    session_registrations: list["SessionRegistrationModel"] = Relationship(back_populates="user")

    def to_domain(self) -> DomainUser:
        return DomainUser(
            id=self.id,
            email=self.email,
            full_name=self.full_name,
            hashed_password=self.hashed_password,
            role=self.role,
            created_at=self.created_at,
        )

    @classmethod
    def from_domain(cls, user: DomainUser) -> "UserModel":
        return cls(
            id=user.id,
            email=user.email,
            full_name=user.full_name,
            hashed_password=user.hashed_password,
            role=user.role,
            created_at=user.created_at,
        )
