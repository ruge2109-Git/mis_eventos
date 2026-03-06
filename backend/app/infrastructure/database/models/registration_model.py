from datetime import datetime
from typing import TYPE_CHECKING

from sqlmodel import Field, Relationship, SQLModel

from app.domain.entities.registration import Registration as DomainRegistration

if TYPE_CHECKING:
    from .event_model import EventModel
    from .user_model import UserModel


class RegistrationModel(SQLModel, table=True):
    __tablename__ = "registrations"
    id: int | None = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id")
    event_id: int = Field(foreign_key="events.id")
    registration_date: datetime = Field(default_factory=datetime.utcnow)

    user: "UserModel" = Relationship(back_populates="registrations")
    event: "EventModel" = Relationship(back_populates="registrations")

    def to_domain(self) -> DomainRegistration:
        return DomainRegistration(
            id=self.id,
            user_id=self.user_id,
            event_id=self.event_id,
            registration_date=self.registration_date,
        )

    @classmethod
    def from_domain(cls, registration: DomainRegistration) -> "RegistrationModel":
        return cls(
            id=registration.id,
            user_id=registration.user_id,
            event_id=registration.event_id,
            registration_date=registration.registration_date,
        )
