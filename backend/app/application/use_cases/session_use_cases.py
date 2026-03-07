from datetime import UTC

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

    def create_session(self, session: Session) -> Session:
        event = self.event_repo.get_by_id(session.event_id)
        if not event:
            raise ResourceNotFoundError(f"Event with ID {session.event_id} not found")

        session_start = _naive_utc(session.start_time)
        session_end = _naive_utc(session.end_time)
        event_start = _naive_utc(event.start_date)
        event_end = _naive_utc(event.end_date)

        if session_start < event_start or session_end > event_end:
            raise InvalidEventStateError(
                f"Session must be within event dates: ({event_start} to {event_end})"
            )

        if session_end <= session_start:
            raise InvalidEventStateError("Session end time must be after start time")

        session.start_time = session_start
        session.end_time = session_end

        existing_sessions = self.session_repo.list_by_event(session.event_id)
        for s in existing_sessions:
            if s.id == session.id:
                continue
            if s.overlaps_with(session):
                raise SessionOverlapError(
                    f"This session overlaps with another session: '{s.title}'"
                )

        return self.session_repo.save(session)

    def get_sessions_by_event(self, event_id: int) -> list[Session]:
        return self.session_repo.list_by_event(event_id)
