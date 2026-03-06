from typing import Optional
from app.domain.entities.user import User, UserRole
from app.application.ports.user_repository import UserRepository
from app.domain.exceptions import ResourceAlreadyExistsError, AuthenticationError
from passlib.context import CryptContext
from app.infrastructure.config.logging import logger

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class UserUseCases:
    def __init__(self, user_repo: UserRepository):
        self.user_repo = user_repo

    def register_user(self, email: str, full_name: str, password: str, role: UserRole = UserRole.ATTENDEE) -> User:
        email_normalized = email.lower().strip()
        
        logger.info(f"Attempting to register user: {email_normalized}")
        if self.user_repo.get_by_email(email_normalized):
            logger.warning(f"Registration attempt with existing email: {email_normalized}")
            raise ResourceAlreadyExistsError(f"The email {email_normalized} is already registered.")

        hashed_password = pwd_context.hash(password)
        new_user = User(
            email=email_normalized,
            full_name=full_name,
            hashed_password=hashed_password,
            role=role
        )
        return self.user_repo.save(new_user)

    def authenticate_user(self, email: str, password: str) -> User:
        email_normalized = email.lower().strip()
        user = self.user_repo.get_by_email(email_normalized)
        
        if not user:
            raise AuthenticationError("Invalid credentials")
        if not pwd_context.verify(password, user.hashed_password):
            raise AuthenticationError("Invalid credentials")
        return user
