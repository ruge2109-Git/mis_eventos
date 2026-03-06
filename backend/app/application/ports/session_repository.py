from abc import ABC, abstractmethod

from app.domain.entities.session import Session


class SessionRepository(ABC):
    @abstractmethod
    def save(self, session: Session) -> Session:
        pass

    @abstractmethod
    def get_by_id(self, session_id: int) -> Session | None:
        pass

    @abstractmethod
    def list_by_event(self, event_id: int) -> list[Session]:
        pass

    @abstractmethod
    def delete(self, session_id: int) -> None:
        pass
