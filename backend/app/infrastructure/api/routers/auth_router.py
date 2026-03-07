import re

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr, Field, field_validator

from app.domain.entities.user import UserRole
from app.infrastructure.api.controllers.auth_controller import AuthController
from app.infrastructure.api.dependencies.provider import get_auth_controller
from app.infrastructure.api.schemas.error_response import ErrorResponse

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"],
    responses={
        400: {"model": ErrorResponse, "description": "Bad Request or Validation Error"},
        500: {"model": ErrorResponse, "description": "Internal Server Error"},
    },
)


class UserRegister(BaseModel):
    email: EmailStr = Field(
        ..., description="The user's email address.", examples=["john.doe@example.com"]
    )
    full_name: str = Field(
        ...,
        min_length=2,
        max_length=100,
        description="The user's full name.",
        examples=["John Doe"],
    )
    password: str = Field(
        ...,
        min_length=8,
        max_length=72,
        description=(
            "A complex password containing at least one uppercase letter, "
            "one lowercase letter, one number, and one special character."
        ),
        examples=["SecureP@ssw0rd!"],
    )
    role: UserRole = Field(
        UserRole.ATTENDEE,
        description="Role of the user in the platform. Admin creation is forbidden.",
    )

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
    email: EmailStr = Field(..., examples=["john.doe@example.com"])
    password: str = Field(..., max_length=72, examples=["SecureP@ssw0rd!"])


class AuthResponse(BaseModel):
    access_token: str = Field(..., description="JWT Bearer Token for authorization")
    token_type: str = Field(
        ..., description="The type of the token", examples=["bearer"]
    )
    user_id: int = Field(..., description="The system ID of the authenticated user")
    role: str = Field(
        ...,
        description="The role of the authenticated user",
        examples=["ATTENDEE", "ORGANIZER", "ADMIN"],
    )


class MessageResponse(BaseModel):
    id: int = Field(..., description="The ID of the newly created resource")
    email: str = Field(..., description="The email bound to the operation")
    message: str = Field(..., description="Result message of the operation")


@router.post(
    "/register",
    response_model=MessageResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user",
    description=(
        "Creates a new user in the system. Roles allowed: Attendee, Organizer. "
        "Creation of Administrators is forbidden."
    ),
    responses={
        403: {
            "model": ErrorResponse,
            "description": "Forbidden: Tried to register an Admin.",
        },
        409: {
            "model": ErrorResponse,
            "description": "Conflict: Email already exists in the system.",
        },
    },
)
def register(
    user_data: UserRegister, controller: AuthController = Depends(get_auth_controller)
):
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
    description=(
        "Authenticates the user and returns a JWT access token for subsequent "
        "authorized requests."
    ),
    responses={
        401: {
            "model": ErrorResponse,
            "description": "Unauthorized: Invalid email or password.",
        }
    },
)
def login(
    login_data: UserLogin, controller: AuthController = Depends(get_auth_controller)
):
    """
    Validates credentials and generates a Bearer token.
    """
    return controller.login(login_data.email, login_data.password)
