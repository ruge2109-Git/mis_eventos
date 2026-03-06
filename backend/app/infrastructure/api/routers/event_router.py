from datetime import datetime

from fastapi import APIRouter, Depends, File, UploadFile, status
from pydantic import BaseModel, Field

from app.domain.entities.user import User
from app.domain.exceptions import ResourceNotFoundError
from app.infrastructure.api.controllers.event_controller import EventController
from app.infrastructure.api.dependencies.provider import RequireOrganizer, get_event_controller

from app.infrastructure.api.schemas.error_response import ErrorResponse

router = APIRouter(
    prefix="/events", 
    tags=["Events"],
    responses={
        400: {"model": ErrorResponse, "description": "Bad Request or Validation Error"},
        401: {"model": ErrorResponse, "description": "Unauthorized: Missing or invalid token"},
        500: {"model": ErrorResponse, "description": "Internal Server Error"},
    }
)


class EventCreateRequest(BaseModel):
    title: str = Field(..., min_length=3, max_length=100, description="The name of the event", examples=["Global Tech Summit"])
    capacity: int = Field(..., gt=0, description="Maximum number of attendees allowed", examples=[500])
    start_date: datetime = Field(..., description="Start date and time of the event", examples=["2026-05-10T10:00:00Z"])
    end_date: datetime = Field(..., description="End date and time of the event", examples=["2026-05-12T18:00:00Z"])
    location: str | None = Field(None, description="Physical location or link for the event", examples=["Convention Center A"])
    description: str | None = Field(None, description="Detailed description of the event")


class EventResponse(BaseModel):
    id: int = Field(..., description="The unique system ID of the event")
    title: str = Field(..., description="The name of the event")
    description: str | None = Field(None, description="Detailed description of the event")
    capacity: int = Field(..., description="Maximum number of attendees allowed")
    status: str = Field(..., description="Current status of the event", examples=["DRAFT", "PUBLISHED", "CANCELLED"])
    location: str | None = Field(None, description="Physical location or link for the event")
    image_url: str | None = Field(None, description="URL pointing to the cover image")
    start_date: datetime = Field(..., description="Start date and time of the event")
    end_date: datetime = Field(..., description="End date and time of the event")
    organizer_id: int = Field(..., description="ID of the User who organized this event")
    warning: str | None = Field(None, description="Warning messages, e.g., if there is a scheduling conflict")


class PaginatedEventResponse(BaseModel):
    items: list[EventResponse]
    total: int
    skip: int
    limit: int


@router.post(
    "/",
    response_model=EventResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new event",
    description=(
        "Registers an event. Hard error if location+time conflict. "
        "Warning if only time conflict. Requires an Organizer role."
    ),
    responses={
        403: {"model": ErrorResponse, "description": "Forbidden: User is not an Organizer."},
        409: {"model": ErrorResponse, "description": "Conflict: Location and Time overlap with another event."}
    }
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
    responses={
        403: {"model": ErrorResponse, "description": "Forbidden: User is not an Organizer."},
        404: {"model": ErrorResponse, "description": "Not Found: Event does not exist."}
    }
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
    response_model=PaginatedEventResponse,
    summary="List events",
    description="Retrieves a paginated list of all registered events.",
)
def list_events(
    skip: int = 0,
    limit: int = 12,
    search: str | None = None,
    status: str | None = "Published",
    controller: EventController = Depends(get_event_controller),
):
    result = controller.list_events(skip=skip, limit=limit, search=search, status=status)
    return {
        "items": result["items"],
        "total": result["total"],
        "skip": skip,
        "limit": limit
    }


@router.get(
    "/{event_id}",
    response_model=EventResponse,
    summary="Get event details",
    description="Retrieves all information of a specific event by its ID.",
    responses={
        404: {"model": ErrorResponse, "description": "Not Found: Event does not exist."}
    }
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
    responses={
        400: {"model": ErrorResponse, "description": "Bad Request: Event might not be in a draft state."},
        403: {"model": ErrorResponse, "description": "Forbidden: User is not an Organizer."},
        404: {"model": ErrorResponse, "description": "Not Found: Event does not exist."}
    }
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
    responses={
        400: {"model": ErrorResponse, "description": "Bad Request: Event cannot be cancelled (e.g. already cancelled)."},
        403: {"model": ErrorResponse, "description": "Forbidden: User is not an Organizer."},
        404: {"model": ErrorResponse, "description": "Not Found: Event does not exist."}
    }
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
