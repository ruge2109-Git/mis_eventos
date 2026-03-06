from typing import List, Optional
from app.domain.entities.registration import Registration
from app.domain.entities.event import EventStatus
from app.domain.entities.user import UserRole
from app.application.ports.registration_repository import RegistrationRepository
from app.application.ports.event_repository import EventRepository
from app.application.ports.user_repository import UserRepository
from app.domain.exceptions import (
    EventCapacityExceededError, ResourceNotFoundError, 
    ResourceAlreadyExistsError, InvalidEventStateError,
    AuthorizationError
)

class RegistrationUseCases:
    def __init__(
        self, 
        registration_repo: RegistrationRepository, 
        event_repo: EventRepository,
        user_repo: UserRepository
    ):
        self.registration_repo = registration_repo
        self.event_repo = event_repo
        self.user_repo = user_repo

    def register_to_event(self, user_id: int, event_id: int) -> Registration:
        # 1. Check if user is an admin (Admins cannot register to events)
        user = self.user_repo.get_by_id(user_id)
        if not user:
            raise ResourceNotFoundError(f"User with ID {user_id} not found")
        
        if user.role == UserRole.ADMIN:
            raise AuthorizationError("Administrators are not allowed to register for events")

        # 2. Check if event exists
        event = self.event_repo.get_by_id(event_id)
        if not event:
            raise ResourceNotFoundError(f"Event with ID {event_id} not found")
        
        # 3. Check event status
        if event.status != EventStatus.PUBLISHED:
            raise InvalidEventStateError(f"Cannot register for an event in '{event.status}' state. It must be Published.")
        
        # 4. Check if already registered
        if self.registration_repo.get_by_user_and_event(user_id, event_id):
            raise ResourceAlreadyExistsError("User is already registered for this event")
        
        # 5. Check capacity
        current_registrations = self.registration_repo.list_by_event(event_id)
        if len(current_registrations) >= event.capacity:
            raise EventCapacityExceededError("The event has reached its maximum capacity")
       
        # 6. Save registration
        registration = Registration(user_id=user_id, event_id=event_id)
        return self.registration_repo.save(registration)

    def unregister_from_event(self, user_id: int, event_id: int) -> None:
        registration = self.registration_repo.get_by_user_and_event(user_id, event_id)
        
        if not registration:
            raise ResourceNotFoundError("You are not registered for this event")
            
        self.registration_repo.delete(registration.id)

    def get_user_registrations(self, user_id: int) -> List[Registration]:
        return self.registration_repo.list_by_user(user_id)
