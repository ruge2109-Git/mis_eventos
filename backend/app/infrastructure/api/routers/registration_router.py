from datetime import datetime

from fastapi import APIRouter, Depends, Response, status
from pydantic import BaseModel, Field

from app.domain.entities.user import User
from app.infrastructure.api.controllers.registration_controller import (
    RegistrationController,
)
from app.infrastructure.api.dependencies.provider import (
    RequireAuthenticated,
    get_registration_controller,
)
from app.infrastructure.api.schemas.error_response import ErrorResponse

router = APIRouter(
    prefix="/registrations",
    tags=["Registrations"],
    responses={
        400: {"model": ErrorResponse, "description": "Bad Request or Validation Error"},
        401: {
            "model": ErrorResponse,
            "description": "Unauthorized: Missing or invalid token",
        },
        500: {"model": ErrorResponse, "description": "Internal Server Error"},
    },
)


class RegistrationRequest(BaseModel):
    event_id: int = Field(
        ..., description="The ID of the event to register for", examples=[1]
    )


class RegistrationResponse(BaseModel):
    id: int = Field(..., description="The unique system ID of the registration log")
    user_id: int = Field(..., description="The ID of the user who registered")
    event_id: int = Field(..., description="The ID of the event")
    registration_date: datetime = Field(
        ..., description="Date and time when the registration occurred"
    )


@router.post(
    "/",
    response_model=RegistrationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register for an event",
    description=(
        "Registers the authenticated user's attendance to an event. "
        "Requires Authentication."
    ),
    responses={
        404: {
            "model": ErrorResponse,
            "description": "Not Found: Event does not exist.",
        },
        409: {
            "model": ErrorResponse,
            "description": "Conflict: User is already registered to this event.",
        },
    },
)
def register_to_event(
    reg_data: RegistrationRequest,
    controller: RegistrationController = Depends(get_registration_controller),
    current_user: User = Depends(RequireAuthenticated),
):
    """
    Checks that the user is not already registered and that the event has free spots.
    user_id is taken from the token.
    """
    return controller.register_to_event(current_user.id, reg_data.event_id)


@router.delete(
    "/event/{event_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Unregister from an event",
    description="Deletes the registration of the authenticated user for a specific event.",
    responses={
        404: {
            "model": ErrorResponse,
            "description": "Not Found: Registration does not exist.",
        }
    },
)
def unregister_from_event(
    event_id: int,
    controller: RegistrationController = Depends(get_registration_controller),
    current_user: User = Depends(RequireAuthenticated),
):
    controller.unregister_from_event(current_user.id, event_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get(
    "/user/{user_id}",
    response_model=list[RegistrationResponse],
    summary="List user registrations",
    description="Shows all events a particular user has registered for.",
    responses={
        404: {
            "model": ErrorResponse,
            "description": "Not Found: User might not exist or has no records.",
        }
    },
)
def get_user_registrations(
    user_id: int,
    controller: RegistrationController = Depends(get_registration_controller),
):
    return controller.get_user_registrations(user_id)
