from passlib.context import CryptContext

from app.application.ports.password_hasher import PasswordHasher


class PasslibPasswordHasher(PasswordHasher):
    def __init__(self):
        self._ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")

    def hash(self, password: str) -> str:
        return self._ctx.hash(password)

    def verify(self, password: str, hashed: str) -> bool:
        return self._ctx.verify(password, hashed)
