"""
Explicit serialization for Event when storing in cache (Redis).
Uses ISO format for datetimes so values are JSON-serializable and stable.
"""
from datetime import datetime

from app.domain.entities.event import Event


def event_to_cache_dict(event: Event) -> dict:
    """Serialize Event to a dict suitable for cache (JSON-compatible)."""
    return {
        "id": event.id,
        "title": event.title,
        "capacity": event.capacity,
        "start_date": event.start_date.isoformat() if event.start_date else None,
        "end_date": event.end_date.isoformat() if event.end_date else None,
        "organizer_id": event.organizer_id,
        "location": event.location,
        "description": event.description,
        "image_url": event.image_url,
        "additional_images": list(event.additional_images) if event.additional_images else [],
        "status": event.status,
    }


def event_from_cache_dict(data: dict) -> Event:
    """Deserialize a cache dict back to Event."""
    start = data.get("start_date")
    end = data.get("end_date")
    if isinstance(start, str):
        start = datetime.fromisoformat(start)
    if isinstance(end, str):
        end = datetime.fromisoformat(end)
    return Event(
        id=data.get("id"),
        title=data["title"],
        capacity=data["capacity"],
        start_date=start,
        end_date=end,
        organizer_id=data["organizer_id"],
        location=data.get("location"),
        description=data.get("description"),
        image_url=data.get("image_url"),
        additional_images=data.get("additional_images") or [],
        status=data.get("status", "DRAFT"),
    )
