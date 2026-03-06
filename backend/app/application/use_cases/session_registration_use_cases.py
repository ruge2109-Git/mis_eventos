from app.application.ports.registration_repository import RegistrationRepository
from app.application.ports.session_registration_repository import SessionRegistrationRepository
from app.application.ports.session_repository import SessionRepository
from app.application.ports.user_repository import UserRepository
from app.domain.entities.session_registration import SessionRegistration
from app.domain.entities.user import UserRole
from app.domain.exceptions import (
    AuthorizationError,
    EventCapacityExceededError,
    ResourceAlreadyExistsError,
    ResourceNotFoundError,
)


class SessionRegistrationUseCases:
    def __init__(
        self,
        session_reg_repo: SessionRegistrationRepository,
        session_repo: SessionRepository,
        registration_repo: RegistrationRepository,
        user_repo: UserRepository,
    ):
        self.session_reg_repo = session_reg_repo
        self.session_repo = session_repo
        self.registration_repo = registration_repo
        self.user_repo = user_repo

    def register_to_session(self, user_id: int, session_id: int) -> SessionRegistration:
        # 1. Check if user is an admin
        user = self.user_repo.get_by_id(user_id)
        if not user:
            raise ResourceNotFoundError(f"User with ID {user_id} not found")

        if user.role == UserRole.ADMIN:
            raise AuthorizationError("Administrators are not allowed to register for sessions")

        # 2. Check if session exists
        session = self.session_repo.get_by_id(session_id)
        if not session:
            raise ResourceNotFoundError(f"Session with ID {session_id} not found")

        # 3. Check if user is registered for the parent event
        event_registration = self.registration_repo.get_by_user_and_event(user_id, session.event_id)
        if not event_registration:
            raise AuthorizationError(
                "You must be registered for the event before joining this session"
            )

        # 4. Check if already registered for this session
        if self.session_reg_repo.get_by_user_and_session(user_id, session_id):
            raise ResourceAlreadyExistsError("You are already registered for this session")

        # 5. Check capacity
        current_regs = self.session_reg_repo.list_by_session(session_id)
        if len(current_regs) >= session.capacity:
            raise EventCapacityExceededError("This session has no more available spots")

        # 6. Save
        new_reg = SessionRegistration(user_id=user_id, session_id=session_id)
        return self.session_reg_repo.save(new_reg)

    def unregister_from_session(self, user_id: int, session_id: int) -> None:
        registration = self.session_reg_repo.get_by_user_and_session(user_id, session_id)
        if not registration:
            raise ResourceNotFoundError("You are not registered for this session")

        self.session_reg_repo.delete(registration.id)

    def list_user_sessions(self, user_id: int) -> list[SessionRegistration]:
        return self.session_reg_repo.list_by_user(user_id)
