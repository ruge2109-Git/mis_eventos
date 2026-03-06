import pytest
from datetime import datetime, timedelta
from app.application.use_cases.session_use_cases import SessionUseCases
from app.domain.entities.session import Session
from app.domain.entities.event import Event
from app.domain.exceptions import SessionOverlapError, ResourceNotFoundError, InvalidEventStateError

class TestSessionUseCases:
    @pytest.fixture
    def mock_repos(self, mocker):
        return {
            "session_repo": mocker.Mock(),
            "event_repo": mocker.Mock()
        }

    @pytest.fixture
    def use_cases(self, mock_repos):
        return SessionUseCases(
            session_repo=mock_repos["session_repo"],
            event_repo=mock_repos["event_repo"]
        )

    def test_create_session_event_not_found(self, use_cases, mock_repos):
        mock_repos["event_repo"].get_by_id.return_value = None
        new_session = Session(
            title="S", start_time=datetime.utcnow(), end_time=datetime.utcnow(),
            speaker="Sp", capacity=10, event_id=1
        )
        with pytest.raises(ResourceNotFoundError):
            use_cases.create_session(new_session)

    def test_create_session_outside_event_dates(self, use_cases, mock_repos):
        now = datetime.utcnow()
        event = Event(title="E", capacity=100, start_date=now, end_date=now + timedelta(hours=5), organizer_id=1, id=1)
        mock_repos["event_repo"].get_by_id.return_value = event
        
        new_session = Session(
            title="S", start_time=now - timedelta(hours=1), end_time=now + timedelta(hours=1),
            speaker="Sp", capacity=10, event_id=1
        )
        with pytest.raises(InvalidEventStateError, match="Session must be within event dates"):
            use_cases.create_session(new_session)

    def test_create_session_invalid_times(self, use_cases, mock_repos):
        now = datetime.utcnow()
        event = Event(title="E", capacity=100, start_date=now, end_date=now + timedelta(hours=5), organizer_id=1, id=1)
        mock_repos["event_repo"].get_by_id.return_value = event
        
        new_session = Session(
            title="S", start_time=now + timedelta(hours=2), end_time=now + timedelta(hours=1),
            speaker="Sp", capacity=10, event_id=1
        )
        with pytest.raises(InvalidEventStateError, match="Session end time must be after start time"):
            use_cases.create_session(new_session)

    def test_create_session_overlap(self, use_cases, mock_repos):
        now = datetime.utcnow()
        event = Event(title="E", capacity=100, start_date=now - timedelta(days=1), end_date=now + timedelta(days=1), organizer_id=1, id=1)
        mock_repos["event_repo"].get_by_id.return_value = event
        
        new_session = Session(
            title="S2", start_time=now, end_time=now + timedelta(hours=1),
            speaker="Sp", capacity=10, event_id=1, id=None
        )
        
        mock_repos["session_repo"].list_by_event.return_value = [
            Session(
                title="S1", start_time=now, end_time=now + timedelta(hours=1),
                speaker="Sp1", capacity=10, event_id=1, id=99
            )
        ]
        
        with pytest.raises(SessionOverlapError, match="This session overlaps with"):
            use_cases.create_session(new_session)

    def test_create_session_success_with_same_id_skip(self, use_cases, mock_repos):
        # This covers the 'continue' in the overlap loop
        now = datetime.utcnow()
        event = Event(title="E", capacity=100, start_date=now - timedelta(days=1), end_date=now + timedelta(days=1), organizer_id=1, id=1)
        mock_repos["event_repo"].get_by_id.return_value = event
        
        # Updating an existing session (same ID)
        session = Session(
            title="S1 Updated", start_time=now, end_time=now + timedelta(hours=1),
            speaker="Sp1", capacity=10, event_id=1, id=99
        )
        
        # Existing sessions list includes the same session
        mock_repos["session_repo"].list_by_event.return_value = [session]
        mock_repos["session_repo"].save.return_value = session
        
        result = use_cases.create_session(session)
        assert result.title == "S1 Updated"

    def test_get_sessions_by_event(self, use_cases, mock_repos):
        mock_repos["session_repo"].list_by_event.return_value = ["S1", "S2"]
        result = use_cases.get_sessions_by_event(1)
        assert len(result) == 2
        mock_repos["session_repo"].list_by_event.assert_called_with(1)
