from datetime import datetime

from fastapi import APIRouter, Depends, Response, status
from pydantic import BaseModel, Field

from app.domain.entities.user import User
from app.infrastructure.api.controllers.session_registration_controller import (
    SessionRegistrationController,
)
from app.infrastructure.api.dependencies.provider import (
    RequireAuthenticated,
    get_session_registration_controller,
)
from app.infrastructure.api.schemas.error_response import ErrorResponse

router = APIRouter(
    prefix="/session-registrations",
    tags=["Session Registrations"],
    responses={
        400: {"model": ErrorResponse, "description": "Bad Request or Validation Error"},
        401: {"model": ErrorResponse, "description": "Unauthorized: Missing or invalid token"},
        500: {"model": ErrorResponse, "description": "Internal Server Error"},
    }
)


class SessionRegistrationRequest(BaseModel):
    session_id: int = Field(..., description="The ID of the session to register for", examples=[1])


class SessionRegistrationResponse(BaseModel):
    id: int = Field(..., description="The unique system ID of the session registration log")
    user_id: int = Field(..., description="The ID of the user who registered")
    session_id: int = Field(..., description="The ID of the session")
    registration_date: datetime = Field(..., description="Date and time when the registration occurred")


@router.post(
    "/",
    response_model=SessionRegistrationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register for a session",
    description=(
        "Registers the authenticated user to a specific session. "
        "Requires previous event registration."
    ),
    responses={
        404: {"model": ErrorResponse, "description": "Not Found: Event or Session does not exist."},
        409: {"model": ErrorResponse, "description": "Conflict: User already registered to this session, or overlapping session."}
    }
)
def register_to_session(
    data: SessionRegistrationRequest,
    controller: SessionRegistrationController = Depends(get_session_registration_controller),
    current_user: User = Depends(RequireAuthenticated),
):
    return controller.register_to_session(current_user.id, data.session_id)


@router.delete(
    "/{session_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Unregister from a session",
    description="Deletes the session registration for the authenticated user.",
    responses={
        404: {"model": ErrorResponse, "description": "Not Found: Registration does not exist."}
    }
)
def unregister_from_session(
    session_id: int,
    controller: SessionRegistrationController = Depends(get_session_registration_controller),
    current_user: User = Depends(RequireAuthenticated),
):
    controller.unregister_from_session(current_user.id, session_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get(
    "/user/{user_id}",
    response_model=list[SessionRegistrationResponse],
    summary="List user session registrations",
    description="Shows all sessions a particular user has registered for.",
    responses={
        404: {"model": ErrorResponse, "description": "Not Found: User might not exist."}
    }
)
def get_user_session_registrations(
    user_id: int,
    controller: SessionRegistrationController = Depends(get_session_registration_controller)
):
    return controller.list_user_sessions(user_id)
