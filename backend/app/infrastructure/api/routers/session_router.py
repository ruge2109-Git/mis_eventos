from datetime import datetime

from fastapi import APIRouter, Depends, status
from pydantic import BaseModel, Field

from app.domain.entities.user import User
from app.infrastructure.api.controllers.session_controller import SessionController
from app.infrastructure.api.dependencies.provider import RequireOrganizer, get_session_controller
from app.infrastructure.api.schemas.error_response import ErrorResponse

router = APIRouter(
    prefix="/sessions",
    tags=["Sessions"],
    responses={
        400: {"model": ErrorResponse, "description": "Bad Request or Validation Error"},
        401: {"model": ErrorResponse, "description": "Unauthorized: Missing or invalid token"},
        500: {"model": ErrorResponse, "description": "Internal Server Error"},
    }
)


class SessionCreateRequest(BaseModel):
    title: str = Field(..., min_length=3, max_length=100, description="The title of the session/activity", examples=["Opening Keynote"])
    start_time: datetime = Field(..., description="Start date and time of the session", examples=["2026-05-10T10:00:00Z"])
    end_time: datetime = Field(..., description="End date and time of the session", examples=["2026-05-10T11:00:00Z"])
    speaker: str = Field(..., description="Name of the person giving the session", examples=["Jane Smith"])
    event_id: int = Field(..., description="The ID of the parent event this session belongs to", examples=[1])
    description: str | None = Field(None, description="Detailed description of what the session is about")


class SessionResponse(BaseModel):
    id: int = Field(..., description="The unique system ID of the session")
    title: str = Field(..., description="The title of the session/activity")
    description: str | None = Field(None, description="Detailed description of what the session is about")
    start_time: datetime = Field(..., description="Start date and time of the session")
    end_time: datetime = Field(..., description="End date and time of the session")
    speaker: str = Field(..., description="Name of the person giving the session")
    event_id: int = Field(..., description="The ID of the parent event this session belongs to")


@router.post(
    "/",
    response_model=SessionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create session for an event",
    description="Adds a specific talk or activity to an existing event. Only Organizers or Admins.",
    responses={
        403: {"model": ErrorResponse, "description": "Forbidden: User is not an Organizer."},
        404: {"model": ErrorResponse, "description": "Not Found: The specified event does not exist."},
        409: {"model": ErrorResponse, "description": "Conflict: Session overlaps with another session."}
    }
)
def create_session(
    session_data: SessionCreateRequest,
    controller: SessionController = Depends(get_session_controller),
    current_user: User = Depends(RequireOrganizer),
):
    """
    Validates automatically that there are no overlapping schedules.
    Ideally we should also check if current_user is the organizer of the event_id.
    """
    return controller.create_session(
        title=session_data.title,
        start_time=session_data.start_time,
        end_time=session_data.end_time,
        speaker=session_data.speaker,
        event_id=session_data.event_id,
        description=session_data.description,
    )


@router.get(
    "/event/{event_id}",
    response_model=list[SessionResponse],
    summary="List sessions for an event",
    description="Retrieves the schedule of activities for a specific event.",
    responses={
        404: {"model": ErrorResponse, "description": "Not Found: Event does not exist."}
    }
)
def get_event_sessions(
    event_id: int, controller: SessionController = Depends(get_session_controller)
):
    return controller.get_event_sessions(event_id)
