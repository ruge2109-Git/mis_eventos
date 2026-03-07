from datetime import datetime

from app.application.use_cases.session_use_cases import SessionUseCases
from app.domain.entities.session import Session


class SessionController:
    def __init__(self, session_use_cases: SessionUseCases):
        self.session_use_cases = session_use_cases

    def create_session(
        self,
        title: str,
        start_time: datetime,
        end_time: datetime,
        speaker: str,
        event_id: int,
        description: str | None,
    ):
        new_session = Session(
            title=title,
            start_time=start_time,
            end_time=end_time,
            speaker=speaker,
            event_id=event_id,
            description=description,
        )
        return self.session_use_cases.create_session(new_session)

    def get_event_sessions(self, event_id: int):
        return self.session_use_cases.get_sessions_by_event(event_id)
