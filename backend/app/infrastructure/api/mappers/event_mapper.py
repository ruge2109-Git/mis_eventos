"""
Maps Event domain entity to API response dict.
Serialization is the responsibility of the adapter (SRP); controller returns domain objects.
"""
from app.domain.entities.event import Event


def event_to_response_dict(event: Event, *, warning: str | None = None) -> dict:
    """Convert Event to a dict suitable for EventResponse API schema."""
    data = {
        "id": event.id,
        "title": event.title,
        "capacity": event.capacity,
        "start_date": event.start_date,
        "end_date": event.end_date,
        "organizer_id": event.organizer_id,
        "location": event.location,
        "description": event.description,
        "image_url": event.image_url,
        "additional_images": list(event.additional_images) if event.additional_images else [],
        "status": event.status,
    }
    if warning is not None:
        data["warning"] = warning
    return data
