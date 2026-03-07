from datetime import datetime

from app.application.use_cases.session_use_cases import SessionUseCases


class SessionController:
    """Orchestrates session operations; does not build domain entities (SRP)."""

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
        return self.session_use_cases.create_session(
            title=title,
            start_time=start_time,
            end_time=end_time,
            speaker=speaker,
            event_id=event_id,
            description=description,
        )

    def update_session(
        self,
        session_id: int,
        *,
        title: str,
        start_time: datetime,
        end_time: datetime,
        speaker: str,
        description: str | None = None,
    ):
        return self.session_use_cases.update_session(
            session_id,
            title=title,
            start_time=start_time,
            end_time=end_time,
            speaker=speaker,
            description=description,
        )

    def delete_session(self, session_id: int) -> None:
        self.session_use_cases.delete_session(session_id)

    def get_event_sessions(self, event_id: int):
        return self.session_use_cases.get_sessions_by_event(event_id)

    def get_session(self, session_id: int):
        return self.session_use_cases.get_session_by_id(session_id)
