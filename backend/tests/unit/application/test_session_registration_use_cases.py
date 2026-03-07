from datetime import datetime

import pytest

from app.application.use_cases.session_registration_use_cases import (
    SessionRegistrationUseCases,
)
from app.domain.entities.session import Session
from app.domain.entities.session_registration import SessionRegistration
from app.domain.entities.user import User, UserRole
from app.domain.exceptions import (
    AuthorizationError,
    ResourceAlreadyExistsError,
    ResourceNotFoundError,
)


class TestSessionRegistrationUseCases:
    @pytest.fixture
    def mock_repos(self, mocker):
        return {
            "session_reg_repo": mocker.Mock(),
            "session_repo": mocker.Mock(),
            "registration_repo": mocker.Mock(),
            "user_repo": mocker.Mock(),
        }

    @pytest.fixture
    def use_cases(self, mock_repos):
        return SessionRegistrationUseCases(
            session_reg_repo=mock_repos["session_reg_repo"],
            session_repo=mock_repos["session_repo"],
            registration_repo=mock_repos["registration_repo"],
            user_repo=mock_repos["user_repo"],
        )

    def test_session_reg_user_not_found(self, use_cases, mock_repos):
        mock_repos["user_repo"].get_by_id.return_value = None
        with pytest.raises(ResourceNotFoundError, match="User with ID 1 not found"):
            use_cases.register_to_session(user_id=1, session_id=10)

    def test_session_reg_admin_not_allowed(self, use_cases, mock_repos):
        mock_repos["user_repo"].get_by_id.return_value = User(
            email="a@a.com",
            full_name="A",
            hashed_password="X",
            role=UserRole.ADMIN,
            id=1,
        )
        with pytest.raises(
            AuthorizationError,
            match="Administrators are not allowed to register for sessions",
        ):
            use_cases.register_to_session(user_id=1, session_id=10)

    def test_session_reg_session_not_found(self, use_cases, mock_repos):
        mock_repos["user_repo"].get_by_id.return_value = User(
            email="a@a.com",
            full_name="A",
            hashed_password="X",
            role=UserRole.ATTENDEE,
            id=1,
        )
        mock_repos["session_repo"].get_by_id.return_value = None
        with pytest.raises(ResourceNotFoundError, match="Session with ID 10 not found"):
            use_cases.register_to_session(user_id=1, session_id=10)

    def test_session_reg_must_be_in_event(self, use_cases, mock_repos):
        mock_repos["user_repo"].get_by_id.return_value = User(
            email="a@a.com",
            full_name="A",
            hashed_password="X",
            role=UserRole.ATTENDEE,
            id=1,
        )
        mock_repos["session_repo"].get_by_id.return_value = Session(
            title="S",
            start_time=datetime.utcnow(),
            end_time=datetime.utcnow(),
            speaker="Sp",
            event_id=100,
            id=10,
        )
        mock_repos["registration_repo"].get_by_user_and_event.return_value = None

        with pytest.raises(
            AuthorizationError,
            match="You must be registered for the event before joining this session",
        ):
            use_cases.register_to_session(user_id=1, session_id=10)

    def test_session_reg_already_registered(self, use_cases, mock_repos):
        mock_repos["user_repo"].get_by_id.return_value = User(
            email="a@a.com",
            full_name="A",
            hashed_password="X",
            role=UserRole.ATTENDEE,
            id=1,
        )
        mock_repos["session_repo"].get_by_id.return_value = Session(
            title="S",
            start_time=datetime.utcnow(),
            end_time=datetime.utcnow(),
            speaker="Sp",
            event_id=100,
            id=10,
        )
        mock_repos["registration_repo"].get_by_user_and_event.return_value = True
        mock_repos["session_reg_repo"].get_by_user_and_session.return_value = True

        with pytest.raises(
            ResourceAlreadyExistsError,
            match="You are already registered for this session",
        ):
            use_cases.register_to_session(user_id=1, session_id=10)

    def test_session_reg_capacity_exceeded(self, use_cases, mock_repos):
        mock_repos["user_repo"].get_by_id.return_value = User(
            email="a@a.com",
            full_name="A",
            hashed_password="X",
            role=UserRole.ATTENDEE,
            id=1,
        )
        mock_repos["session_repo"].get_by_id.return_value = Session(
            title="S",
            start_time=datetime.utcnow(),
            end_time=datetime.utcnow(),
            speaker="Sp",
            event_id=100,
            id=10,
        )
        mock_repos["registration_repo"].get_by_user_and_event.return_value = True
        mock_repos["session_reg_repo"].get_by_user_and_session.return_value = None
        mock_repos["session_reg_repo"].list_by_session.return_value = [1, 2]
        mock_repos["session_reg_repo"].save.side_effect = lambda x: x
        # Session capacity was removed; registration now succeeds
        result = use_cases.register_to_session(user_id=1, session_id=10)
        assert result.session_id == 10

    def test_session_reg_success(self, use_cases, mock_repos):
        mock_repos["user_repo"].get_by_id.return_value = User(
            email="a@a.com",
            full_name="A",
            hashed_password="X",
            role=UserRole.ATTENDEE,
            id=1,
        )
        mock_repos["session_repo"].get_by_id.return_value = Session(
            title="S",
            start_time=datetime.utcnow(),
            end_time=datetime.utcnow(),
            speaker="Sp",
            event_id=100,
            id=10,
        )
        mock_repos["registration_repo"].get_by_user_and_event.return_value = True
        mock_repos["session_reg_repo"].get_by_user_and_session.return_value = None
        mock_repos["session_reg_repo"].list_by_session.return_value = []
        mock_repos["session_reg_repo"].save.side_effect = lambda x: x

        result = use_cases.register_to_session(user_id=1, session_id=10)
        assert result.session_id == 10

    def test_session_unregister_success(self, use_cases, mock_repos):
        s_reg = SessionRegistration(user_id=1, session_id=10, id=8)
        mock_repos["session_reg_repo"].get_by_user_and_session.return_value = s_reg

        use_cases.unregister_from_session(1, 10)
        mock_repos["session_reg_repo"].delete.assert_called_with(8)

    def test_session_unregister_not_found(self, use_cases, mock_repos):
        mock_repos["session_reg_repo"].get_by_user_and_session.return_value = None
        with pytest.raises(
            ResourceNotFoundError, match="You are not registered for this session"
        ):
            use_cases.unregister_from_session(user_id=1, session_id=10)

    def test_list_by_user(self, use_cases, mock_repos):
        mock_repos["session_reg_repo"].list_by_user.return_value = ["R1"]
        result = use_cases.list_user_sessions(1)
        assert len(result) == 1
