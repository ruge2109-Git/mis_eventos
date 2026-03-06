from sqlmodel import Session, select

from app.application.ports.session_repository import SessionRepository
from app.domain.entities.session import Session as DomainSession
from app.infrastructure.database.models import SessionModel

from .base_repository import BaseRepository


class PostgresSessionRepository(BaseRepository[SessionModel], SessionRepository):
    def __init__(self, session: Session):
        super().__init__(session, SessionModel)

    def save(self, session: DomainSession) -> DomainSession:
        db_model = SessionModel.from_domain(session)
        saved_model = self._save(db_model)
        return saved_model.to_domain()

    def get_by_id(self, session_id: int) -> DomainSession | None:
        db_session = self._get_by_id(session_id)
        return db_session.to_domain() if db_session else None

    def list_by_event(self, event_id: int) -> list[DomainSession]:
        statement = select(SessionModel).where(SessionModel.event_id == event_id)
        db_sessions = self.session.exec(statement).all()
        return [s.to_domain() for s in db_sessions]

    def delete(self, session_id: int) -> None:
        self._delete(session_id)
