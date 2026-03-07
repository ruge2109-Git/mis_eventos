from abc import ABC, abstractmethod


class PasswordHasher(ABC):
    """Port for hashing and verifying passwords."""

    @abstractmethod
    def hash(self, password: str) -> str:
        pass

    @abstractmethod
    def verify(self, password: str, hashed: str) -> bool:
        pass
