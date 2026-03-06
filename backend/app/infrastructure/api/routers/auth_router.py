import re

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr, Field, field_validator

from app.domain.entities.user import UserRole
from app.infrastructure.api.controllers.auth_controller import AuthController
from app.infrastructure.api.dependencies.provider import get_auth_controller

router = APIRouter(prefix="/auth", tags=["Authentication"])


class UserRegister(BaseModel):
    email: EmailStr
    full_name: str = Field(..., min_length=2, max_length=100)
    password: str = Field(..., min_length=8, max_length=72)
    role: UserRole = UserRole.ATTENDEE

    @field_validator("password")
    @classmethod
    def password_complexity(cls, v: str) -> str:
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not re.search(r"[a-z]", v):
            raise ValueError("Password must contain at least one lowercase letter")
        if not re.search(r"\d", v):
            raise ValueError("Password must contain at least one number")
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', v):
            raise ValueError("Password must contain at least one special character")
        return v


class UserLogin(BaseModel):
    email: EmailStr
    password: str = Field(..., max_length=72)


class AuthResponse(BaseModel):
    access_token: str
    token_type: str
    user_id: int
    role: str


class MessageResponse(BaseModel):
    id: int
    email: str
    message: str


@router.post(
    "/register",
    response_model=MessageResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user",
    description="Creates a new user in the system. Roles allowed: Attendee, Organizer.",
)
def register(user_data: UserRegister, controller: AuthController = Depends(get_auth_controller)):
    """
    Registers a user. Administrators cannot be created via this public endpoint.
    """
    if user_data.role == UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Registration as Administrator is not allowed through this endpoint.",
        )

    return controller.register(
        email=user_data.email,
        full_name=user_data.full_name,
        password=user_data.password,
        role=user_data.role,
    )


@router.post(
    "/login",
    response_model=AuthResponse,
    summary="Log in",
    description="Authenticates the user and returns a JWT access token.",
)
def login(login_data: UserLogin, controller: AuthController = Depends(get_auth_controller)):
    """
    Validates credentials and generates a Bearer token.
    """
    return controller.login(login_data.email, login_data.password)
