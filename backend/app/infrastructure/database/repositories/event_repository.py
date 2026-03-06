from datetime import datetime

from sqlmodel import Session, and_, func, select

from app.application.ports.event_repository import EventRepository
from app.domain.entities.event import Event as DomainEvent
from app.domain.entities.event import EventStatus
from app.infrastructure.database.models import EventModel

from .base_repository import BaseRepository


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
            statement = statement.where(EventModel.title.contains(search))
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
                EventModel.status != EventStatus.CANCELLED,
            )
        )
        if exclude_id:
            statement = statement.where(EventModel.id != exclude_id)
        db_events = self.session.exec(statement).all()
        return [db_event.to_domain() for db_event in db_events]

    def delete(self, event_id: int) -> None:
        self._delete(event_id)
