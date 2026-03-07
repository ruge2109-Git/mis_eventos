from datetime import datetime

from sqlalchemy import or_
from sqlmodel import Session, and_, func, select

from app.application.dto.event_with_organizer import EventWithOrganizer
from app.application.ports.event_repository import EventRepository
from app.application.utils.search import normalize_search
from app.domain.entities.event import Event as DomainEvent
from app.domain.entities.event import EventStatus
from app.infrastructure.database.models import EventModel, UserModel

from .base_repository import BaseRepository


def _search_condition(normalized: str) -> object:
    """Case-insensitive search on event title. Term is already normalized (lowercase, no accents)."""
    return EventModel.title.ilike(f"%{normalized}%")


def _search_with_organizer_condition(normalized: str) -> object:
    """Search on event title, location, or organizer email (case-insensitive)."""
    pattern = f"%{normalized}%"
    return or_(
        EventModel.title.ilike(pattern),
        EventModel.location.ilike(pattern),
        UserModel.email.ilike(pattern),
    )


class PostgresEventRepository(BaseRepository[EventModel], EventRepository):
    def __init__(self, session: Session):
        super().__init__(session, EventModel)

    def save(self, event: DomainEvent) -> DomainEvent:
        db_model = EventModel.from_domain(event)
        saved_model = self._save(db_model)
        return saved_model.to_domain()

    def get_by_id(self, event_id: int) -> DomainEvent | None:
        db_event = self._get_by_id(event_id)
        return db_event.to_domain() if db_event else None

    def get_by_ids(self, event_ids: list[int]) -> list[DomainEvent]:
        if not event_ids:
            return []
        statement = select(EventModel).where(EventModel.id.in_(event_ids))
        db_events = self.session.exec(statement).all()
        return [e.to_domain() for e in db_events]

    def list_all(
        self,
        skip: int = 0,
        limit: int = 100,
        search: str | None = None,
        status: str | None = None,
        organizer_id: int | None = None,
    ) -> tuple[list[DomainEvent], int]:
        statement = select(EventModel)
        if search:
            normalized = normalize_search(search)
            if normalized:
                statement = statement.where(_search_condition(normalized))
        if status:
            statement = statement.where(EventModel.status == status)
        if organizer_id is not None:
            statement = statement.where(EventModel.organizer_id == organizer_id)

        count_statement = select(func.count()).select_from(statement.subquery())
        total = self.session.exec(count_statement).one()

        statement = statement.offset(skip).limit(limit)

        db_events = self.session.exec(statement).all()
        return [db_event.to_domain() for db_event in db_events], total

    def find_overlapping(
        self, start_date: datetime, end_date: datetime, exclude_id: int | None = None
    ) -> list[DomainEvent]:
        statement = select(EventModel).where(
            and_(
                EventModel.start_date < end_date,
                EventModel.end_date > start_date,
                EventModel.status != EventStatus.CANCELLED.value,
            )
        )
        if exclude_id:
            statement = statement.where(EventModel.id != exclude_id)
        db_events = self.session.exec(statement).all()
        return [db_event.to_domain() for db_event in db_events]

    def delete(self, event_id: int) -> None:
        self._delete(event_id)

    def list_all_with_organizer(
        self,
        skip: int = 0,
        limit: int = 100,
        search: str | None = None,
        status: str | None = None,
        organizer_id: int | None = None,
    ) -> tuple[list[EventWithOrganizer], int]:
        statement = (
            select(EventModel, UserModel.email, UserModel.full_name)
            .join(UserModel, EventModel.organizer_id == UserModel.id)
        )
        if search:
            normalized = normalize_search(search)
            if normalized:
                statement = statement.where(_search_with_organizer_condition(normalized))
        if status:
            statement = statement.where(EventModel.status == status)
        if organizer_id is not None:
            statement = statement.where(EventModel.organizer_id == organizer_id)

        count_statement = select(func.count()).select_from(
            statement.subquery()
        )
        total = self.session.exec(count_statement).one()

        statement = statement.offset(skip).limit(limit).order_by(
            EventModel.start_date.desc()
        )
        rows = self.session.exec(statement).all()
        result = [
            EventWithOrganizer(
                event=db_event.to_domain(),
                organizer_email=email,
                organizer_full_name=full_name or "",
            )
            for db_event, email, full_name in rows
        ]
        return result, total

    def list_upcoming(
        self, skip: int = 0, limit: int = 10, search: str | None = None
    ) -> tuple[list[DomainEvent], int]:
        now = datetime.utcnow()
        base = (
            select(EventModel)
            .where(EventModel.status == EventStatus.PUBLISHED.value)
            .where(EventModel.start_date >= now)
        )
        if search and (normalized := normalize_search(search)):
            base = base.where(_search_condition(normalized))
        count_stmt = select(func.count()).select_from(base.subquery())
        total = self.session.exec(count_stmt).one() or 0
        data_stmt = base.order_by(EventModel.start_date.asc()).offset(skip).limit(limit)
        db_events = self.session.exec(data_stmt).all()
        return [e.to_domain() for e in db_events], total
