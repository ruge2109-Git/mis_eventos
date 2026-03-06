from datetime import datetime
from typing import TYPE_CHECKING

from sqlmodel import Field, Relationship, SQLModel

from app.domain.entities.session_registration import (
    SessionRegistration as DomainSessionRegistration,
)

if TYPE_CHECKING:
    from .session_model import SessionModel
    from .user_model import UserModel


class SessionRegistrationModel(SQLModel, table=True):
    __tablename__ = "session_registrations"
    id: int | None = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id")
    session_id: int = Field(foreign_key="sessions.id")
    registration_date: datetime = Field(default_factory=datetime.utcnow)

    user: "UserModel" = Relationship(back_populates="session_registrations")
    session: "SessionModel" = Relationship(back_populates="registrations")

    def to_domain(self) -> DomainSessionRegistration:
        return DomainSessionRegistration(
            id=self.id,
            user_id=self.user_id,
            session_id=self.session_id,
            registration_date=self.registration_date,
        )

    @classmethod
    def from_domain(cls, reg: DomainSessionRegistration) -> "SessionRegistrationModel":
        return cls(
            id=reg.id,
            user_id=reg.user_id,
            session_id=reg.session_id,
            registration_date=reg.registration_date,
        )
