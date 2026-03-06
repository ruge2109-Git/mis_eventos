from fastapi import Depends, HTTPException, status
from sqlmodel import Session

from app.application.ports.cache_service import CacheService
from app.application.ports.storage_service import StorageService
from app.application.use_cases.event_use_cases import EventUseCases
from app.application.use_cases.registration_use_cases import RegistrationUseCases
from app.application.use_cases.session_registration_use_cases import SessionRegistrationUseCases
from app.application.use_cases.session_use_cases import SessionUseCases
from app.application.use_cases.user_use_cases import UserUseCases
from app.domain.entities.user import User, UserRole
from app.domain.exceptions import AuthorizationError
from app.infrastructure.api.controllers.auth_controller import AuthController
from app.infrastructure.api.controllers.event_controller import EventController
from app.infrastructure.api.controllers.registration_controller import RegistrationController
from app.infrastructure.api.controllers.session_controller import SessionController
from app.infrastructure.api.controllers.session_registration_controller import (
    SessionRegistrationController,
)
from app.infrastructure.api.security.jwt_handler import get_current_user_email
from app.infrastructure.config.database import get_session
from app.infrastructure.config.settings import settings
from app.infrastructure.database.repositories import (
    PostgresEventRepository,
    PostgresRegistrationRepository,
    PostgresSessionRegistrationRepository,
    PostgresSessionRepository,
    PostgresUserRepository,
)
from app.infrastructure.services.cache_service import RedisCacheService
from app.infrastructure.services.storage_service import LocalStorageService

# --- Application Layer Providers ---


def get_storage_service() -> StorageService:
    return LocalStorageService(upload_dir=settings.UPLOAD_DIR, base_url=settings.STATIC_URL)


def get_cache_service() -> CacheService:
    return RedisCacheService(url=settings.REDIS_URL)


def get_user_use_cases(session: Session = Depends(get_session)) -> UserUseCases:
    repo = PostgresUserRepository(session)
    return UserUseCases(repo)


def get_event_use_cases(
    session: Session = Depends(get_session),
    storage: StorageService = Depends(get_storage_service),
    cache: CacheService = Depends(get_cache_service),
) -> EventUseCases:
    repo = PostgresEventRepository(session)
    return EventUseCases(repo, storage, cache)


def get_session_use_cases(session: Session = Depends(get_session)) -> SessionUseCases:
    session_repo = PostgresSessionRepository(session)
    event_repo = PostgresEventRepository(session)
    return SessionUseCases(session_repo, event_repo)


def get_registration_use_cases(session: Session = Depends(get_session)) -> RegistrationUseCases:
    reg_repo = PostgresRegistrationRepository(session)
    event_repo = PostgresEventRepository(session)
    user_repo = PostgresUserRepository(session)
    return RegistrationUseCases(reg_repo, event_repo, user_repo)


def get_session_registration_use_cases(
    session: Session = Depends(get_session),
) -> SessionRegistrationUseCases:
    session_reg_repo = PostgresSessionRegistrationRepository(session)
    session_repo = PostgresSessionRepository(session)
    reg_repo = PostgresRegistrationRepository(session)
    user_repo = PostgresUserRepository(session)
    return SessionRegistrationUseCases(session_reg_repo, session_repo, reg_repo, user_repo)


# --- Controller Providers ---


def get_auth_controller(
    user_use_cases: UserUseCases = Depends(get_user_use_cases),
) -> AuthController:
    return AuthController(user_use_cases)


def get_event_controller(
    event_use_cases: EventUseCases = Depends(get_event_use_cases),
) -> EventController:
    return EventController(event_use_cases)


def get_session_controller(
    session_use_cases: SessionUseCases = Depends(get_session_use_cases),
) -> SessionController:
    return SessionController(session_use_cases)


def get_registration_controller(
    registration_use_cases: RegistrationUseCases = Depends(get_registration_use_cases),
) -> RegistrationController:
    return RegistrationController(registration_use_cases)


def get_session_registration_controller(
    use_cases: SessionRegistrationUseCases = Depends(get_session_registration_use_cases),
) -> SessionRegistrationController:
    return SessionRegistrationController(use_cases)


# --- Security Dependencies ---


def get_current_user(
    email: str = Depends(get_current_user_email),
    use_cases: UserUseCases = Depends(get_user_use_cases),
) -> User:
    user = use_cases.user_repo.get_by_email(email.lower())
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


class RoleChecker:
    def __init__(self, allowed_roles: list[UserRole]):
        self.allowed_roles = allowed_roles

    def __call__(self, user: User = Depends(get_current_user)) -> User:
        if user.role not in self.allowed_roles:
            raise AuthorizationError(f"Role '{user.role}' is not allowed for this operation")
        return user


RequireAdmin = RoleChecker([UserRole.ADMIN])
RequireOrganizer = RoleChecker([UserRole.ADMIN, UserRole.ORGANIZER])
RequireAuthenticated = get_current_user
