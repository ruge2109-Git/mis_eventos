from fastapi import APIRouter, Depends, status, Response
from pydantic import BaseModel
from datetime import datetime
from app.infrastructure.api.controllers.session_registration_controller import SessionRegistrationController
from app.infrastructure.api.dependencies.provider import get_session_registration_controller, RequireAuthenticated
from app.domain.entities.user import User

router = APIRouter(prefix="/session-registrations", tags=["Session Registrations"])

class SessionRegistrationRequest(BaseModel):
    session_id: int

class SessionRegistrationResponse(BaseModel):
    id: int
    user_id: int
    session_id: int
    registration_date: datetime

@router.post(
    "/", 
    response_model=SessionRegistrationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register for a session",
    description="Registers the authenticated user to a specific session. Requires previous event registration."
)
def register_to_session(
    data: SessionRegistrationRequest,
    controller: SessionRegistrationController = Depends(get_session_registration_controller),
    current_user: User = Depends(RequireAuthenticated)
):
    return controller.register_to_session(current_user.id, data.session_id)

@router.delete(
    "/{session_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Unregister from a session",
    description="Deletes the session registration for the authenticated user."
)
def unregister_from_session(
    session_id: int,
    controller: SessionRegistrationController = Depends(get_session_registration_controller),
    current_user: User = Depends(RequireAuthenticated)
):
    controller.unregister_from_session(current_user.id, session_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
