import pytest
from datetime import datetime
from app.application.use_cases.registration_use_cases import RegistrationUseCases
from app.domain.entities.event import Event, EventStatus
from app.domain.entities.user import User, UserRole
from app.domain.entities.registration import Registration
from app.domain.exceptions import (
    ResourceNotFoundError, AuthorizationError, InvalidEventStateError,
    EventCapacityExceededError, ResourceAlreadyExistsError
)

class TestRegistrationUseCases:
    @pytest.fixture
    def mock_repos(self, mocker):
        return {
            "reg_repo": mocker.Mock(),
            "event_repo": mocker.Mock(),
            "user_repo": mocker.Mock()
        }

    @pytest.fixture
    def use_cases(self, mock_repos):
        return RegistrationUseCases(
            registration_repo=mock_repos["reg_repo"],
            event_repo=mock_repos["event_repo"],
            user_repo=mock_repos["user_repo"]
        )

    def test_register_user_not_found(self, use_cases, mock_repos):
        mock_repos["user_repo"].get_by_id.return_value = None
        with pytest.raises(ResourceNotFoundError, match="User with ID 1 not found"):
            use_cases.register_to_event(user_id=1, event_id=10)

    def test_register_admin_not_allowed(self, use_cases, mock_repos):
        mock_repos["user_repo"].get_by_id.return_value = User(
            email="a@a.com", full_name="A", hashed_password="X", role=UserRole.ADMIN, id=1
        )
        with pytest.raises(AuthorizationError, match="Administrators are not allowed to register for events"):
            use_cases.register_to_event(user_id=1, event_id=10)

    def test_register_event_not_found(self, use_cases, mock_repos):
        mock_repos["user_repo"].get_by_id.return_value = User(
            email="a@a.com", full_name="A", hashed_password="X", role=UserRole.ATTENDEE, id=1
        )
        mock_repos["event_repo"].get_by_id.return_value = None
        with pytest.raises(ResourceNotFoundError, match="Event with ID 10 not found"):
            use_cases.register_to_event(user_id=1, event_id=10)

    def test_register_event_not_published(self, use_cases, mock_repos):
        mock_repos["user_repo"].get_by_id.return_value = User(
            email="a@a.com", full_name="A", hashed_password="X", role=UserRole.ATTENDEE, id=1
        )
        mock_repos["event_repo"].get_by_id.return_value = Event(
            title="T", capacity=10, start_date=datetime.utcnow(), 
            end_date=datetime.utcnow(), organizer_id=2, status=EventStatus.DRAFT, id=10
        )
        with pytest.raises(InvalidEventStateError, match="Cannot register for an event in 'Draft' state"):
            use_cases.register_to_event(user_id=1, event_id=10)

    def test_register_already_registered(self, use_cases, mock_repos):
        mock_repos["user_repo"].get_by_id.return_value = User(
            email="a@a.com", full_name="A", hashed_password="X", role=UserRole.ATTENDEE, id=1
        )
        mock_repos["event_repo"].get_by_id.return_value = Event(
            title="T", capacity=10, start_date=datetime.utcnow(), 
            end_date=datetime.utcnow(), organizer_id=2, status=EventStatus.PUBLISHED, id=10
        )
        mock_repos["reg_repo"].get_by_user_and_event.return_value = True 

        with pytest.raises(ResourceAlreadyExistsError, match="User is already registered for this event"):
            use_cases.register_to_event(user_id=1, event_id=10)

    def test_register_capacity_exceeded(self, use_cases, mock_repos):
        mock_repos["user_repo"].get_by_id.return_value = User(
            email="a@a.com", full_name="A", hashed_password="X", role=UserRole.ATTENDEE, id=1
        )
        mock_repos["event_repo"].get_by_id.return_value = Event(
            title="T", capacity=2, start_date=datetime.utcnow(), 
            end_date=datetime.utcnow(), organizer_id=2, status=EventStatus.PUBLISHED, id=10
        )
        mock_repos["reg_repo"].get_by_user_and_event.return_value = None
        mock_repos["reg_repo"].list_by_event.return_value = [1, 2]
        
        with pytest.raises(EventCapacityExceededError, match="The event has reached its maximum capacity"):
            use_cases.register_to_event(user_id=1, event_id=10)

    def test_register_success(self, use_cases, mock_repos):
        user = User(email="a@a.com", full_name="A", hashed_password="X", role=UserRole.ATTENDEE, id=1)
        event = Event(
            title="T", capacity=10, start_date=datetime.utcnow(), 
            end_date=datetime.utcnow(), organizer_id=2, status=EventStatus.PUBLISHED, id=10
        )
        mock_repos["user_repo"].get_by_id.return_value = user
        mock_repos["event_repo"].get_by_id.return_value = event
        mock_repos["reg_repo"].get_by_user_and_event.return_value = None
        mock_repos["reg_repo"].list_by_event.return_value = []
        mock_repos["reg_repo"].save.side_effect = lambda x: x
        
        result = use_cases.register_to_event(user_id=1, event_id=10)
        assert result.user_id == 1
        assert result.event_id == 10

    def test_unregister_success(self, use_cases, mock_repos):
        reg = Registration(user_id=1, event_id=10, id=5)
        mock_repos["reg_repo"].get_by_user_and_event.return_value = reg
        
        use_cases.unregister_from_event(1, 10)
        mock_repos["reg_repo"].delete.assert_called_with(5)

    def test_unregister_not_found(self, use_cases, mock_repos):
        mock_repos["reg_repo"].get_by_user_and_event.return_value = None
        with pytest.raises(ResourceNotFoundError):
            use_cases.unregister_from_event(1, 10)

    def test_get_user_registrations(self, use_cases, mock_repos):
        mock_repos["reg_repo"].list_by_user.return_value = ["R1", "R2"]
        result = use_cases.get_user_registrations(1)
        assert len(result) == 2
