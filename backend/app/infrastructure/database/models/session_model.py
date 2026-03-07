from datetime import datetime
from typing import TYPE_CHECKING

from sqlmodel import Field, Relationship, SQLModel

from app.domain.entities.session import Session as DomainSession

if TYPE_CHECKING:
    from .event_model import EventModel
    from .session_registration_model import SessionRegistrationModel


class SessionModel(SQLModel, table=True):
    __tablename__ = "sessions"
    id: int | None = Field(default=None, primary_key=True)
    title: str
    description: str | None = None
    start_time: datetime
    end_time: datetime
    speaker: str
    event_id: int = Field(foreign_key="events.id")

    event: "EventModel" = Relationship(back_populates="sessions")
    registrations: list["SessionRegistrationModel"] = Relationship(back_populates="session")

    def to_domain(self) -> DomainSession:
        return DomainSession(
            id=self.id,
            title=self.title,
            description=self.description,
            start_time=self.start_time,
            end_time=self.end_time,
            speaker=self.speaker,
            event_id=self.event_id,
        )

    @classmethod
    def from_domain(cls, session: DomainSession) -> "SessionModel":
        return cls(
            id=session.id,
            title=session.title,
            description=session.description,
            start_time=session.start_time,
            end_time=session.end_time,
            speaker=session.speaker,
            event_id=session.event_id,
        )
