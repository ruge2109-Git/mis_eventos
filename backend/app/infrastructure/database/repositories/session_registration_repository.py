from sqlmodel import Session, select

from app.application.ports.session_registration_repository import SessionRegistrationRepository
from app.domain.entities.session_registration import (
    SessionRegistration as DomainSessionRegistration,
)
from app.infrastructure.database.models import SessionRegistrationModel

from .base_repository import BaseRepository


class PostgresSessionRegistrationRepository(
    BaseRepository[SessionRegistrationModel], SessionRegistrationRepository
):
    def __init__(self, session: Session):
        super().__init__(session, SessionRegistrationModel)

    def save(self, registration: DomainSessionRegistration) -> DomainSessionRegistration:
        db_model = SessionRegistrationModel.from_domain(registration)
        saved_model = self._save(db_model)
        return saved_model.to_domain()

    def get_by_user_and_session(
        self, user_id: int, session_id: int
    ) -> DomainSessionRegistration | None:
        statement = select(SessionRegistrationModel).where(
            SessionRegistrationModel.user_id == user_id,
            SessionRegistrationModel.session_id == session_id,
        )
        db_reg = self.session.exec(statement).first()
        return db_reg.to_domain() if db_reg else None

    def list_by_session(self, session_id: int) -> list[DomainSessionRegistration]:
        statement = select(SessionRegistrationModel).where(
            SessionRegistrationModel.session_id == session_id
        )
        db_regs = self.session.exec(statement).all()
        return [r.to_domain() for r in db_regs]

    def delete(self, registration_id: int) -> None:
        self._delete(registration_id)
