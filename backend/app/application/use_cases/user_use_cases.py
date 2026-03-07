from app.application.ports.password_hasher import PasswordHasher
from app.application.ports.user_repository import UserRepository
from app.domain.entities.user import User, UserRole
from app.domain.exceptions import AuthenticationError, ResourceAlreadyExistsError
from app.infrastructure.config.logging import logger


class UserUseCases:
    def __init__(self, user_repo: UserRepository, password_hasher: PasswordHasher):
        self.user_repo = user_repo
        self.password_hasher = password_hasher

    def register_user(
        self, email: str, full_name: str, password: str, role: UserRole = UserRole.ATTENDEE
    ) -> User:
        email_normalized = email.lower().strip()

        logger.info(f"Attempting to register user: {email_normalized}")
        if self.user_repo.get_by_email(email_normalized):
            logger.warning(f"Registration attempt with existing email: {email_normalized}")
            raise ResourceAlreadyExistsError(f"The email {email_normalized} is already registered.")

        hashed_password = self.password_hasher.hash(password)
        new_user = User(
            email=email_normalized, full_name=full_name, hashed_password=hashed_password, role=role
        )
        return self.user_repo.save(new_user)

    def get_user_by_email(self, email: str) -> User | None:
        """Returns the user by email, or None if not found. Used by auth/provider."""
        return self.user_repo.get_by_email(email.lower().strip())

    def get_user_by_id(self, user_id: int) -> User | None:
        """Returns the user by id, or None if not found."""
        return self.user_repo.get_by_id(user_id)

    def list_users(
        self,
        skip: int = 0,
        limit: int = 100,
        search: str | None = None,
        role: str | None = None,
    ) -> tuple[list[User], int]:
        """List users with optional search and role filter. For admin use."""
        return self.user_repo.list_all(skip=skip, limit=limit, search=search, role=role)

    def authenticate_user(self, email: str, password: str) -> User:
        email_normalized = email.lower().strip()
        user = self.user_repo.get_by_email(email_normalized)

        if not user:
            raise AuthenticationError("Invalid credentials")
        if not self.password_hasher.verify(password, user.hashed_password):
            raise AuthenticationError("Invalid credentials")
        return user
