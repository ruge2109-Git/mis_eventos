from typing import Optional, TYPE_CHECKING, List
from sqlmodel import Field, SQLModel, Relationship
from datetime import datetime
from app.domain.entities.session import Session as DomainSession

if TYPE_CHECKING:
    from .event_model import EventModel
    from .session_registration_model import SessionRegistrationModel

class SessionModel(SQLModel, table=True):
    __tablename__ = "sessions"
    id: Optional[int] = Field(default=None, primary_key=True)
    title: str
    description: Optional[str] = None
    start_time: datetime
    end_time: datetime
    speaker: str
    capacity: int
    event_id: int = Field(foreign_key="events.id")
    
    event: "EventModel" = Relationship(back_populates="sessions")
    registrations: List["SessionRegistrationModel"] = Relationship(back_populates="session")

    def to_domain(self) -> DomainSession:
        return DomainSession(
            id=self.id,
            title=self.title,
            description=self.description,
            start_time=self.start_time,
            end_time=self.end_time,
            speaker=self.speaker,
            capacity=self.capacity,
            event_id=self.event_id
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
            capacity=session.capacity,
            event_id=session.event_id
        )
