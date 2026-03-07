"""DTOs for auth API responses; controller returns these instead of raw dicts (SRP)."""
from dataclasses import dataclass


@dataclass
class LoginResponse:
    access_token: str
    token_type: str
    user_id: int
    role: str
    full_name: str = ""


@dataclass
class RegisterResponse:
    id: int
    email: str
    message: str
