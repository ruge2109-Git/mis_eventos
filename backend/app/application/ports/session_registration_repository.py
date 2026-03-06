from abc import ABC, abstractmethod
from typing import Optional, List
from app.domain.entities.session_registration import SessionRegistration

class SessionRegistrationRepository(ABC):
    @abstractmethod
    def save(self, registration: SessionRegistration) -> SessionRegistration:
        pass

    @abstractmethod
    def get_by_user_and_session(self, user_id: int, session_id: int) -> Optional[SessionRegistration]:
        pass

    @abstractmethod
    def list_by_session(self, session_id: int) -> List[SessionRegistration]:
        pass

    @abstractmethod
    def delete(self, registration_id: int) -> None:
        pass
