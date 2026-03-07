from datetime import datetime

from app.application.ports.cache_service import CacheService
from app.application.ports.event_cache_policy import EventCachePolicy
from app.application.ports.event_repository import EventRepository
from app.application.use_cases.event._validation import check_overlaps, validate_event_dates
from app.domain.entities.event import Event
from app.domain.exceptions import ResourceNotFoundError


class UpdateEventUseCase:
    def __init__(
        self,
        event_repo: EventRepository,
        cache: CacheService,
        cache_policy: EventCachePolicy,
    ):
        self.event_repo = event_repo
        self.cache = cache
        self.cache_policy = cache_policy

    def execute(
        self,
        event_id: int,
        *,
        title: str | None = None,
        capacity: int | None = None,
        start_date: datetime | None = None,
        end_date: datetime | None = None,
        location: str | None = None,
        description: str | None = None,
        additional_images: list[str] | None = None,
    ) -> Event:
        event = self.event_repo.get_by_id(event_id)
        if not event:
            raise ResourceNotFoundError(f"Event with ID {event_id} not found")

        if title is not None:
            event.title = title
        if capacity is not None:
            event.capacity = capacity
        if start_date is not None:
            event.start_date = start_date
        if end_date is not None:
            event.end_date = end_date
        if location is not None:
            event.location = location
        if description is not None:
            event.description = description
        if additional_images is not None:
            event.additional_images = list(additional_images)

        validate_event_dates(event.start_date, event.end_date)
        check_overlaps(
            self.event_repo,
            event.start_date,
            event.end_date,
            event.location,
            exclude_id=event_id,
        )

        updated = self.event_repo.save(event)
        self.cache.delete_by_prefix(self.cache_policy.list_invalidation_prefix())
        self.cache.delete(self.cache_policy.event_key(event_id))
        return updated
