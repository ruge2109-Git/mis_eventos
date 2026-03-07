from datetime import datetime, timedelta

import pytest

from app.application.use_cases.session_use_cases import SessionUseCases
from app.domain.entities.event import Event
from app.domain.entities.session import Session
from app.domain.exceptions import (
    InvalidEventStateError,
    ResourceNotFoundError,
    SessionOverlapError,
)


class TestSessionUseCases:
    @pytest.fixture
    def mock_repos(self, mocker):
        return {"session_repo": mocker.Mock(), "event_repo": mocker.Mock()}

    @pytest.fixture
    def use_cases(self, mock_repos):
        return SessionUseCases(
            session_repo=mock_repos["session_repo"], event_repo=mock_repos["event_repo"]
        )

    def test_create_session_event_not_found(self, use_cases, mock_repos):
        mock_repos["event_repo"].get_by_id.return_value = None
        now = datetime.utcnow()
        with pytest.raises(ResourceNotFoundError):
            use_cases.create_session(
                title="S",
                start_time=now,
                end_time=now + timedelta(hours=1),
                speaker="Sp",
                event_id=1,
            )

    def test_create_session_outside_event_dates(self, use_cases, mock_repos):
        now = datetime.utcnow()
        event = Event(
            title="E",
            capacity=100,
            start_date=now,
            end_date=now + timedelta(hours=5),
            organizer_id=1,
            id=1,
        )
        mock_repos["event_repo"].get_by_id.return_value = event

        with pytest.raises(
            InvalidEventStateError, match="Session must be within event dates"
        ):
            use_cases.create_session(
                title="S",
                start_time=now - timedelta(hours=1),
                end_time=now + timedelta(hours=1),
                speaker="Sp",
                event_id=1,
            )

    def test_create_session_invalid_times(self, use_cases, mock_repos):
        now = datetime.utcnow()
        event = Event(
            title="E",
            capacity=100,
            start_date=now,
            end_date=now + timedelta(hours=5),
            organizer_id=1,
            id=1,
        )
        mock_repos["event_repo"].get_by_id.return_value = event

        with pytest.raises(
            InvalidEventStateError, match="Session end time must be after start time"
        ):
            use_cases.create_session(
                title="S",
                start_time=now + timedelta(hours=2),
                end_time=now + timedelta(hours=1),
                speaker="Sp",
                event_id=1,
            )

    def test_create_session_overlap(self, use_cases, mock_repos):
        now = datetime.utcnow()
        event = Event(
            title="E",
            capacity=100,
            start_date=now - timedelta(days=1),
            end_date=now + timedelta(days=1),
            organizer_id=1,
            id=1,
        )
        mock_repos["event_repo"].get_by_id.return_value = event

        mock_repos["session_repo"].list_by_event.return_value = [
            Session(
                title="S1",
                start_time=now,
                end_time=now + timedelta(hours=1),
                speaker="Sp1",
                event_id=1,
                id=99,
            )
        ]

        with pytest.raises(SessionOverlapError, match="This session overlaps with"):
            use_cases.create_session(
                title="S2",
                start_time=now,
                end_time=now + timedelta(hours=1),
                speaker="Sp",
                event_id=1,
            )

    def test_create_session_success(self, use_cases, mock_repos):
        now = datetime.utcnow()
        event = Event(
            title="E",
            capacity=100,
            start_date=now - timedelta(days=1),
            end_date=now + timedelta(days=1),
            organizer_id=1,
            id=1,
        )
        mock_repos["event_repo"].get_by_id.return_value = event

        saved_session = Session(
            title="S1",
            start_time=now,
            end_time=now + timedelta(hours=1),
            speaker="Sp1",
            event_id=1,
            id=99,
        )
        mock_repos["session_repo"].list_by_event.return_value = []
        mock_repos["session_repo"].save.return_value = saved_session

        result = use_cases.create_session(
            title="S1",
            start_time=now,
            end_time=now + timedelta(hours=1),
            speaker="Sp1",
            event_id=1,
        )
        assert result.title == "S1"

    def test_get_sessions_by_event(self, use_cases, mock_repos):
        mock_repos["session_repo"].list_by_event.return_value = ["S1", "S2"]
        result = use_cases.get_sessions_by_event(1)
        assert len(result) == 2
        mock_repos["session_repo"].list_by_event.assert_called_with(1)
