from typing import List, Optional
from app.domain.entities.session import Session
from app.application.ports.session_repository import SessionRepository
from app.application.ports.event_repository import EventRepository
from app.domain.exceptions import SessionOverlapError, InvalidEventStateError, ResourceNotFoundError

class SessionUseCases:
    def __init__(self, session_repo: SessionRepository, event_repo: EventRepository):
        self.session_repo = session_repo
        self.event_repo = event_repo

    def create_session(self, session: Session) -> Session:

        event = self.event_repo.get_by_id(session.event_id)
        if not event:
            raise ResourceNotFoundError(f"Event with ID {session.event_id} not found")

        if session.start_time < event.start_date or session.end_time > event.end_date:
            raise InvalidEventStateError(
                f"Session must be within event dates: ({event.start_date} to {event.end_date})"
            )

        if session.end_time <= session.start_time:
            raise InvalidEventStateError("Session end time must be after start time")

        existing_sessions = self.session_repo.list_by_event(session.event_id)
        for s in existing_sessions:
            if s.id == session.id:
                continue
            if s.overlaps_with(session):
                raise SessionOverlapError(f"This session overlaps with another session: '{s.title}'")
        
        return self.session_repo.save(session)

    def get_sessions_by_event(self, event_id: int) -> List[Session]:
        return self.session_repo.list_by_event(event_id)
