from typing import Optional
from sqlmodel import Session, select
from app.domain.entities.user import User as DomainUser
from app.application.ports.user_repository import UserRepository
from app.infrastructure.database.models import UserModel
from .base_repository import BaseRepository

class PostgresUserRepository(BaseRepository[UserModel], UserRepository):
    def __init__(self, session: Session):
        super().__init__(session, UserModel)

    def save(self, user: DomainUser) -> DomainUser:
        db_user = UserModel.from_domain(user)
        saved_model = self._save(db_user)
        return saved_model.to_domain()

    def get_by_id(self, user_id: int) -> Optional[DomainUser]:
        db_user = self._get_by_id(user_id)
        return db_user.to_domain() if db_user else None

    def get_by_email(self, email: str) -> Optional[DomainUser]:
        statement = select(UserModel).where(UserModel.email == email)
        db_user = self.session.exec(statement).first()
        return db_user.to_domain() if db_user else None

    def delete(self, user_id: int) -> None:
        self._delete(user_id)
