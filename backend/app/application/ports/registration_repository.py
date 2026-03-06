from abc import ABC, abstractmethod
from typing import Optional, List
from app.domain.entities.registration import Registration

class RegistrationRepository(ABC):
    @abstractmethod
    def save(self, registration: Registration) -> Registration:
        pass

    @abstractmethod
    def get_by_user_and_event(self, user_id: int, event_id: int) -> Optional[Registration]:
        pass

    @abstractmethod
    def list_by_user(self, user_id: int) -> List[Registration]:
        pass

    @abstractmethod
    def list_by_event(self, event_id: int) -> List[Registration]:
        pass

    @abstractmethod
    def delete(self, registration_id: int) -> None:
        pass
