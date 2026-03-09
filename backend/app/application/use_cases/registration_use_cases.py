from app.application.ports.event_repository import EventRepository
from app.application.ports.registration_repository import RegistrationRepository
from app.application.ports.user_repository import UserRepository
from app.domain.entities.event import Event
from app.domain.entities.event import EventStatus
from app.domain.entities.registration import EventAttendee, Registration
from app.domain.entities.user import UserRole
from app.domain.exceptions import (
    AuthorizationError,
    EventCapacityExceededError,
    InvalidEventStateError,
    ResourceAlreadyExistsError,
    ResourceNotFoundError,
)


class RegistrationUseCases:
    def __init__(
        self,
        registration_repo: RegistrationRepository,
        event_repo: EventRepository,
        user_repo: UserRepository,
    ):
        self.registration_repo = registration_repo
        self.event_repo = event_repo
        self.user_repo = user_repo

    def register_to_event(self, user_id: int, event_id: int) -> Registration:
        user = self.user_repo.get_by_id(user_id)
        if not user:
            raise ResourceNotFoundError(f"User with ID {user_id} not found")

        if user.role == UserRole.ADMIN:
            raise AuthorizationError("Administrators are not allowed to register for events")

        event = self.event_repo.get_by_id(event_id)
        if not event:
            raise ResourceNotFoundError(f"Event with ID {event_id} not found")

        if event.status != EventStatus.PUBLISHED.value:
            raise InvalidEventStateError(
                f"Cannot register for an event in '{event.status}' state. It must be Published."
            )

        if self.registration_repo.get_by_user_and_event(user_id, event_id):
            raise ResourceAlreadyExistsError("User is already registered for this event")

        current_registrations = self.registration_repo.list_by_event(event_id)
        if len(current_registrations) >= event.capacity:
            raise EventCapacityExceededError("The event has reached its maximum capacity")

        registration = Registration(user_id=user_id, event_id=event_id)
        return self.registration_repo.save(registration)

    def unregister_from_event(self, user_id: int, event_id: int) -> None:
        registration = self.registration_repo.get_by_user_and_event(user_id, event_id)

        if not registration:
            raise ResourceNotFoundError("You are not registered for this event")

        self.registration_repo.delete(registration.id)

    def get_user_registrations(self, user_id: int) -> list[Registration]:
        return self.registration_repo.list_by_user(user_id)

    def get_user_registered_events(self, user_id: int) -> list[Event]:
        regs = self.registration_repo.list_by_user(user_id)
        if not regs:
            return []
        event_ids = [r.event_id for r in regs]
        return self.event_repo.get_by_ids(event_ids)

    def get_user_registered_events_paginated(
        self, user_id: int, skip: int = 0, limit: int = 10, search: str | None = None
    ) -> tuple[list[Event], int]:
        return self.registration_repo.list_registered_events_paginated(
            user_id, skip=skip, limit=limit, search=search
        )

    def get_registration_count_for_event(self, event_id: int) -> int:
        return self.registration_repo.get_count_by_event(event_id)

    def get_registration_counts_for_events(self, event_ids: list[int]) -> dict[int, int]:
        return self.registration_repo.get_counts_by_event_ids(event_ids)

    def list_attendees_for_event(
        self, event_id: int, skip: int = 0, limit: int = 10, search: str | None = None
    ) -> tuple[list[EventAttendee], int]:
        return self.registration_repo.list_attendees_by_event(
            event_id, skip=skip, limit=limit, search=search
        )

    def get_top_attendees(
        self, skip: int = 0, limit: int = 10, search: str | None = None
    ) -> tuple[list[tuple[int, str, str, int]], int]:
        return self.registration_repo.get_top_users_by_registrations(
            skip=skip, limit=limit, search=search
        )
