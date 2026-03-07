from sqlmodel import Session, func, select

from app.application.ports.registration_repository import RegistrationRepository
from app.application.utils.search import normalize_search
from app.domain.entities.registration import EventAttendee, Registration as DomainRegistration
from app.infrastructure.database.models import EventModel, RegistrationModel, UserModel

from .base_repository import BaseRepository


class PostgresRegistrationRepository(BaseRepository[RegistrationModel], RegistrationRepository):
    def __init__(self, session: Session):
        super().__init__(session, RegistrationModel)

    def save(self, registration: DomainRegistration) -> DomainRegistration:
        db_model = RegistrationModel.from_domain(registration)
        saved_model = self._save(db_model)
        return saved_model.to_domain()

    def get_by_user_and_event(self, user_id: int, event_id: int) -> DomainRegistration | None:
        statement = select(RegistrationModel).where(
            RegistrationModel.user_id == user_id, RegistrationModel.event_id == event_id
        )
        db_reg = self.session.exec(statement).first()
        return db_reg.to_domain() if db_reg else None

    def list_by_user(self, user_id: int) -> list[DomainRegistration]:
        statement = select(RegistrationModel).where(RegistrationModel.user_id == user_id)
        db_regs = self.session.exec(statement).all()
        return [r.to_domain() for r in db_regs]

    def list_by_event(self, event_id: int) -> list[DomainRegistration]:
        statement = select(RegistrationModel).where(RegistrationModel.event_id == event_id)
        db_regs = self.session.exec(statement).all()
        return [r.to_domain() for r in db_regs]

    def get_count_by_event(self, event_id: int) -> int:
        statement = select(func.count(RegistrationModel.id)).where(
            RegistrationModel.event_id == event_id
        )
        return self.session.exec(statement).one() or 0

    def get_counts_by_event_ids(self, event_ids: list[int]) -> dict[int, int]:
        if not event_ids:
            return {}
        statement = (
            select(RegistrationModel.event_id, func.count(RegistrationModel.id))
            .where(RegistrationModel.event_id.in_(event_ids))
            .group_by(RegistrationModel.event_id)
        )
        rows = self.session.exec(statement).all()
        return {row[0]: row[1] for row in rows}

    def delete(self, registration_id: int) -> None:
        self._delete(registration_id)

    def list_attendees_by_event(
        self, event_id: int, skip: int = 0, limit: int = 10, search: str | None = None
    ) -> tuple[list[EventAttendee], int]:
        count_stmt = (
            select(func.count(RegistrationModel.id))
            .join(UserModel, RegistrationModel.user_id == UserModel.id)
            .where(RegistrationModel.event_id == event_id)
        )
        if search and (term := search.strip()):
            pattern = f"%{term}%"
            count_stmt = count_stmt.where(
                (UserModel.full_name.ilike(pattern)) | (UserModel.email.ilike(pattern))
            )
        total = self.session.exec(count_stmt).one() or 0
        data_stmt = (
            select(RegistrationModel, UserModel)
            .join(UserModel, RegistrationModel.user_id == UserModel.id)
            .where(RegistrationModel.event_id == event_id)
        )
        if search and (term := search.strip()):
            pattern = f"%{term}%"
            data_stmt = data_stmt.where(
                (UserModel.full_name.ilike(pattern)) | (UserModel.email.ilike(pattern))
            )
        data_stmt = (
            data_stmt.order_by(RegistrationModel.registration_date.desc())
            .offset(skip)
            .limit(limit)
        )
        rows = self.session.exec(data_stmt).all()
        return [
            EventAttendee(
                id=reg.id if reg.id is not None else 0,
                user_id=reg.user_id,
                full_name=user.full_name,
                email=user.email,
                registration_date=reg.registration_date,
            )
            for reg, user in rows
        ], total

    def get_top_users_by_registrations(
        self, skip: int = 0, limit: int = 10, search: str | None = None
    ) -> tuple[list[tuple[int, str, str, int]], int]:
        base = (
            select(
                UserModel.id,
                UserModel.full_name,
                UserModel.email,
                func.count(RegistrationModel.id).label("cnt"),
            )
            .join(UserModel, RegistrationModel.user_id == UserModel.id)
            .group_by(UserModel.id, UserModel.full_name, UserModel.email)
        )
        if search and (term := search.strip()):
            pattern = f"%{term}%"
            base = base.where(
                (UserModel.full_name.ilike(pattern)) | (UserModel.email.ilike(pattern))
            )
        count_stmt = select(func.count()).select_from(base.subquery())
        total = self.session.exec(count_stmt).one() or 0
        data_stmt = base.order_by(func.count(RegistrationModel.id).desc()).offset(skip).limit(limit)
        rows = self.session.exec(data_stmt).all()
        return [(row[0], row[1], row[2], row[3]) for row in rows], total

    def list_registered_events_paginated(
        self, user_id: int, skip: int = 0, limit: int = 10, search: str | None = None
    ) -> tuple[list, int]:
        from app.domain.entities.event import Event as DomainEvent

        base = (
            select(EventModel)
            .join(RegistrationModel, RegistrationModel.event_id == EventModel.id)
            .where(RegistrationModel.user_id == user_id)
        )
        if search and (normalized := normalize_search(search)):
            base = base.where(EventModel.title.ilike(f"%{normalized}%"))
        count_stmt = select(func.count()).select_from(base.subquery())
        total = self.session.exec(count_stmt).one() or 0
        data_stmt = (
            base.order_by(EventModel.start_date.desc()).offset(skip).limit(limit)
        )
        rows = self.session.exec(data_stmt).all()
        return [e.to_domain() for e in rows], total
