from sqlmodel import Session, select, func, or_

from app.application.ports.user_repository import UserRepository
from app.domain.entities.user import User as DomainUser
from app.infrastructure.database.models import UserModel

from .base_repository import BaseRepository


class PostgresUserRepository(BaseRepository[UserModel], UserRepository):
    def __init__(self, session: Session):
        super().__init__(session, UserModel)

    def save(self, user: DomainUser) -> DomainUser:
        db_user = UserModel.from_domain(user)
        saved_model = self._save(db_user)
        return saved_model.to_domain()

    def get_by_id(self, user_id: int) -> DomainUser | None:
        db_user = self._get_by_id(user_id)
        return db_user.to_domain() if db_user else None

    def get_by_email(self, email: str) -> DomainUser | None:
        statement = select(UserModel).where(UserModel.email == email)
        db_user = self.session.exec(statement).first()
        return db_user.to_domain() if db_user else None

    def delete(self, user_id: int) -> None:
        self._delete(user_id)

    def list_all(
        self,
        skip: int = 0,
        limit: int = 100,
        search: str | None = None,
        role: str | None = None,
    ) -> tuple[list[DomainUser], int]:
        statement = select(UserModel)
        if search:
            term = f"%{search}%"
            statement = statement.where(
                or_(
                    UserModel.email.ilike(term),
                    UserModel.full_name.ilike(term),
                )
            )
        if role:
            statement = statement.where(UserModel.role == role)

        count_statement = select(func.count()).select_from(statement.subquery())
        total = self.session.exec(count_statement).one()

        statement = statement.offset(skip).limit(limit).order_by(UserModel.created_at.desc())
        db_users = self.session.exec(statement).all()
        return [u.to_domain() for u in db_users], total
