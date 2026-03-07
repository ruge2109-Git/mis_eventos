from datetime import UTC, datetime

from app.application.ports.event_repository import EventRepository
from app.application.ports.session_repository import SessionRepository
from app.domain.entities.session import Session
from app.domain.exceptions import InvalidEventStateError, ResourceNotFoundError, SessionOverlapError


def _naive_utc(dt):
    if dt.tzinfo is not None:
        return dt.astimezone(UTC).replace(tzinfo=None)
    return dt


class SessionUseCases:
    def __init__(self, session_repo: SessionRepository, event_repo: EventRepository):
        self.session_repo = session_repo
        self.event_repo = event_repo

    def create_session(
        self,
        title: str,
        start_time: datetime,
        end_time: datetime,
        speaker: str,
        event_id: int,
        description: str | None = None,
    ) -> Session:
        """Create a session; entity is built inside the use case (SRP)."""
        event = self.event_repo.get_by_id(event_id)
        if not event:
            raise ResourceNotFoundError(f"Event with ID {event_id} not found")

        session_start = _naive_utc(start_time)
        session_end = _naive_utc(end_time)
        event_start = _naive_utc(event.start_date)
        event_end = _naive_utc(event.end_date)

        if session_start < event_start or session_end > event_end:
            raise InvalidEventStateError(
                f"Session must be within event dates: ({event_start} to {event_end})"
            )

        if session_end <= session_start:
            raise InvalidEventStateError("Session end time must be after start time")

        new_session = Session(
            title=title,
            start_time=session_start,
            end_time=session_end,
            speaker=speaker,
            event_id=event_id,
            description=description,
        )

        existing_sessions = self.session_repo.list_by_event(event_id)
        for s in existing_sessions:
            if s.overlaps_with(new_session):
                raise SessionOverlapError(
                    f"This session overlaps with another session: '{s.title}'"
                )

        return self.session_repo.save(new_session)

    def get_sessions_by_event(self, event_id: int) -> list[Session]:
        return self.session_repo.list_by_event(event_id)
