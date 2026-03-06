from typing import Optional, TYPE_CHECKING, List
from sqlmodel import Field, SQLModel, Relationship
from datetime import datetime
from app.domain.entities.session_registration import SessionRegistration as DomainSessionRegistration

if TYPE_CHECKING:
    from .user_model import UserModel
    from .session_model import SessionModel

class SessionRegistrationModel(SQLModel, table=True):
    __tablename__ = "session_registrations"
    id: Optional[int] = Field(default=None, primary_key=True)
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
            registration_date=self.registration_date
        )

    @classmethod
    def from_domain(cls, reg: DomainSessionRegistration) -> "SessionRegistrationModel":
        return cls(
            id=reg.id,
            user_id=reg.user_id,
            session_id=reg.session_id,
            registration_date=reg.registration_date
        )
