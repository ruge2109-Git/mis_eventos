from datetime import datetime

from fastapi import APIRouter, Depends, File, UploadFile, status
from pydantic import BaseModel

from app.domain.entities.user import User
from app.domain.exceptions import ResourceNotFoundError
from app.infrastructure.api.controllers.event_controller import EventController
from app.infrastructure.api.dependencies.provider import RequireOrganizer, get_event_controller

router = APIRouter(prefix="/events", tags=["Events"])


class EventCreateRequest(BaseModel):
    title: str
    capacity: int
    start_date: datetime
    end_date: datetime
    location: str | None = None
    description: str | None = None


class EventResponse(BaseModel):
    id: int
    title: str
    description: str | None = None
    capacity: int
    status: str
    location: str | None = None
    image_url: str | None = None
    start_date: datetime
    end_date: datetime
    organizer_id: int
    warning: str | None = None


@router.post(
    "/",
    response_model=EventResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new event",
    description=(
        "Registers an event. Hard error if location+time conflict. "
        "Warning if only time conflict."
    ),
)
def create_event(
    event_data: EventCreateRequest,
    controller: EventController = Depends(get_event_controller),
    current_user: User = Depends(RequireOrganizer),
):
    """
    Organizer identity is automatically taken from JWT session.
    """
    return controller.create_event(
        title=event_data.title,
        capacity=event_data.capacity,
        start_date=event_data.start_date,
        end_date=event_data.end_date,
        location=event_data.location,
        organizer_id=current_user.id,
        description=event_data.description,
    )


@router.post(
    "/{event_id}/image",
    response_model=EventResponse,
    summary="Upload event image",
    description=(
        "Uploads and optimizes (WebP) an image for the event. "
        "Only organizers/admins can do this."
    ),
)
def upload_event_image(
    event_id: int,
    file: UploadFile = File(...),
    controller: EventController = Depends(get_event_controller),
    current_user: User = Depends(RequireOrganizer),
):
    return controller.upload_image(event_id, file)


@router.get(
    "/",
    response_model=list[EventResponse],
    summary="List events",
    description="Retrieves a paginated list of all registered events.",
)
def list_events(
    skip: int = 0,
    limit: int = 100,
    search: str | None = None,
    controller: EventController = Depends(get_event_controller),
):
    return controller.list_events(skip=skip, limit=limit, search=search)


@router.get(
    "/{event_id}",
    response_model=EventResponse,
    summary="Get event details",
    description="Retrieves all information of a specific event by its ID.",
)
def get_event(event_id: int, controller: EventController = Depends(get_event_controller)):
    event = controller.get_event(event_id)
    if not event:
        raise ResourceNotFoundError(f"Event with ID {event_id} not found")
    return event


@router.post(
    "/{event_id}/publish",
    response_model=EventResponse,
    summary="Publish event",
    description="Publishes an event, making it available for registration. Requires Organizer/Admin.",
)
def publish_event(
    event_id: int, 
    controller: EventController = Depends(get_event_controller),
    current_user: User = Depends(RequireOrganizer)
):
    """
    Publish an event.
    """
    return controller.publish_event(event_id)


@router.post(
    "/{event_id}/cancel",
    response_model=EventResponse,
    summary="Cancel event",
    description="Cancels an event. Requires Organizer/Admin.",
)
def cancel_event(
    event_id: int, 
    controller: EventController = Depends(get_event_controller),
    current_user: User = Depends(RequireOrganizer)
):
    """
    Cancel an event.
    """
    return controller.cancel_event(event_id)
