from typing import Optional, List
from sqlmodel import Session, select
from app.domain.entities.registration import Registration as DomainRegistration
from app.application.ports.registration_repository import RegistrationRepository
from app.infrastructure.database.models import RegistrationModel
from .base_repository import BaseRepository

class PostgresRegistrationRepository(BaseRepository[RegistrationModel], RegistrationRepository):
    def __init__(self, session: Session):
        super().__init__(session, RegistrationModel)

    def save(self, registration: DomainRegistration) -> DomainRegistration:
        db_model = RegistrationModel.from_domain(registration)
        saved_model = self._save(db_model)
        return saved_model.to_domain()

    def get_by_user_and_event(self, user_id: int, event_id: int) -> Optional[DomainRegistration]:
        statement = select(RegistrationModel).where(
            RegistrationModel.user_id == user_id,
            RegistrationModel.event_id == event_id
        )
        db_reg = self.session.exec(statement).first()
        return db_reg.to_domain() if db_reg else None

    def list_by_user(self, user_id: int) -> List[DomainRegistration]:
        statement = select(RegistrationModel).where(RegistrationModel.user_id == user_id)
        db_regs = self.session.exec(statement).all()
        return [r.to_domain() for r in db_regs]

    def list_by_event(self, event_id: int) -> List[DomainRegistration]:
        statement = select(RegistrationModel).where(RegistrationModel.event_id == event_id)
        db_regs = self.session.exec(statement).all()
        return [r.to_domain() for r in db_regs]

    def delete(self, registration_id: int) -> None:
        self._delete(registration_id)
