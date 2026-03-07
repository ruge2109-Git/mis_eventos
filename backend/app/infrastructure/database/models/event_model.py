from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Column, JSON
from sqlmodel import Field, Relationship, SQLModel

from app.domain.entities.event import Event as DomainEvent

if TYPE_CHECKING:
    from .registration_model import RegistrationModel
    from .session_model import SessionModel
    from .user_model import UserModel


class EventModel(SQLModel, table=True):
    __tablename__ = "events"
    id: int | None = Field(default=None, primary_key=True)
    title: str = Field(index=True)
    description: str | None = None
    capacity: int
    status: str
    location: str | None = None
    image_url: str | None = None
    additional_images: list[str] | None = Field(default=None, sa_column=Column(JSON, nullable=True))
    start_date: datetime
    end_date: datetime
    organizer_id: int = Field(foreign_key="users.id")

    organizer: "UserModel" = Relationship(back_populates="events")
    sessions: list["SessionModel"] = Relationship(back_populates="event")
    registrations: list["RegistrationModel"] = Relationship(back_populates="event")

    def to_domain(self) -> DomainEvent:
        return DomainEvent(
            id=self.id,
            title=self.title,
            description=self.description,
            capacity=self.capacity,
            status=self.status,
            location=self.location,
            image_url=self.image_url,
            additional_images=self.additional_images or [],
            start_date=self.start_date,
            end_date=self.end_date,
            organizer_id=self.organizer_id,
        )

    @classmethod
    def from_domain(cls, event: DomainEvent) -> "EventModel":
        return cls(
            id=event.id,
            title=event.title,
            description=event.description,
            capacity=event.capacity,
            status=event.status,
            location=event.location,
            image_url=event.image_url,
            additional_images=event.additional_images or [],
            start_date=event.start_date,
            end_date=event.end_date,
            organizer_id=event.organizer_id,
        )
