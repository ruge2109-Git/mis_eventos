from datetime import datetime

from fastapi import APIRouter, Depends, Response, status
from pydantic import BaseModel

from app.domain.entities.user import User
from app.infrastructure.api.controllers.registration_controller import RegistrationController
from app.infrastructure.api.dependencies.provider import (
    RequireAuthenticated,
    get_registration_controller,
)

router = APIRouter(prefix="/registrations", tags=["Registrations"])


class RegistrationRequest(BaseModel):
    event_id: int


class RegistrationResponse(BaseModel):
    id: int
    user_id: int
    event_id: int
    registration_date: datetime


@router.post(
    "/",
    response_model=RegistrationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register for an event",
    description=(
        "Registers the authenticated user's attendance to an event. "
        "Requires Authentication."
    ),
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
)
def get_user_registrations(
    user_id: int, controller: RegistrationController = Depends(get_registration_controller)
):
    return controller.get_user_registrations(user_id)
