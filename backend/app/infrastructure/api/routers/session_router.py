from fastapi import APIRouter, Depends, status
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel
from app.infrastructure.api.controllers.session_controller import SessionController
from app.infrastructure.api.dependencies.provider import get_session_controller, RequireOrganizer
from app.domain.entities.user import User

router = APIRouter(prefix="/sessions", tags=["Sessions"])

class SessionCreateRequest(BaseModel):
    title: str
    start_time: datetime
    end_time: datetime
    speaker: str
    capacity: int
    event_id: int
    description: Optional[str] = None

class SessionResponse(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    start_time: datetime
    end_time: datetime
    speaker: str
    capacity: int
    event_id: int

@router.post(
    "/", 
    response_model=SessionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create session for an event",
    description="Adds a specific talk or activity to an existing event. Only Organizers or Admins."
)
def create_session(
    session_data: SessionCreateRequest, 
    controller: SessionController = Depends(get_session_controller),
    current_user: User = Depends(RequireOrganizer)
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
        capacity=session_data.capacity,
        event_id=session_data.event_id,
        description=session_data.description
    )

@router.get(
    "/event/{event_id}", 
    response_model=List[SessionResponse],
    summary="List sessions for an event",
    description="Retrieves the schedule of activities for a specific event."
)
def get_event_sessions(event_id: int, controller: SessionController = Depends(get_session_controller)):
    return controller.get_event_sessions(event_id)
