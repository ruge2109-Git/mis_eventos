import pytest

from app.application.use_cases.user_use_cases import UserUseCases
from app.domain.entities.user import User, UserRole
from app.domain.exceptions import AuthenticationError, ResourceAlreadyExistsError


class TestUserUseCases:
    @pytest.fixture
    def mock_user_repo(self, mocker):
        return mocker.Mock()

    @pytest.fixture
    def mock_password_hasher(self, mocker):
        hasher = mocker.Mock()
        hasher.hash.return_value = "hashed_password"
        hasher.verify.return_value = True
        return hasher

    @pytest.fixture
    def use_cases(self, mock_user_repo, mock_password_hasher):
        return UserUseCases(user_repo=mock_user_repo, password_hasher=mock_password_hasher)

    def test_register_user_success(self, use_cases, mock_user_repo, mock_password_hasher):
        mock_user_repo.get_by_email.return_value = None
        mock_user_repo.save.side_effect = lambda x: x

        user = use_cases.register_user("test@test.com", "Name", "password123")
        assert user.email == "test@test.com"
        mock_user_repo.save.assert_called_once()
        mock_password_hasher.hash.assert_called_once_with("password123")

    def test_register_user_already_exists(self, use_cases, mock_user_repo):
        mock_user_repo.get_by_email.return_value = User("test@test.com", "N", "H")
        with pytest.raises(ResourceAlreadyExistsError):
            use_cases.register_user("test@test.com", "Name", "password")

    def test_authenticate_user_not_found(self, use_cases, mock_user_repo):
        mock_user_repo.get_by_email.return_value = None
        with pytest.raises(AuthenticationError):
            use_cases.authenticate_user(email="test@test.com", password="pwd")

    def test_authenticate_invalid_password(self, use_cases, mock_user_repo, mock_password_hasher):
        user = User(
            email="test@test.com",
            full_name="N",
            hashed_password="hashed_pwd",
            role=UserRole.ATTENDEE
        )
        mock_user_repo.get_by_email.return_value = user
        mock_password_hasher.verify.return_value = False

        with pytest.raises(AuthenticationError):
            use_cases.authenticate_user(email="test@test.com", password="wrong_password")

    def test_authenticate_success(self, use_cases, mock_user_repo, mock_password_hasher):
        user = User(
            email="test@test.com",
            full_name="N",
            hashed_password="hashed_pwd",
            role=UserRole.ATTENDEE
        )
        mock_user_repo.get_by_email.return_value = user
        mock_password_hasher.verify.return_value = True

        result = use_cases.authenticate_user(email="test@test.com", password="correct_password")
        assert result == user
