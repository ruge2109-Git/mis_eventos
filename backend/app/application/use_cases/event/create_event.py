from dataclasses import dataclass
from datetime import datetime

from app.application.ports.cache_service import CacheService
from app.application.ports.event_cache_policy import EventCachePolicy
from app.application.ports.event_repository import EventRepository
from app.application.use_cases.event._validation import check_overlaps, validate_event_dates
from app.domain.entities.event import Event
from app.infrastructure.config.logging import logger


@dataclass
class CreateEventResult:
    event: Event
    warning: str | None = None


class CreateEventUseCase:
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
        title: str,
        capacity: int,
        start_date: datetime,
        end_date: datetime,
        organizer_id: int,
        location: str | None = None,
        description: str | None = None,
    ) -> CreateEventResult:
        validate_event_dates(start_date, end_date)
        warning = check_overlaps(
            self.event_repo, start_date, end_date, location=location
        )

        new_event = Event(
            title=title,
            capacity=capacity,
            start_date=start_date,
            end_date=end_date,
            organizer_id=organizer_id,
            location=location,
            description=description,
        )
        saved_event = self.event_repo.save(new_event)

        self.cache.delete_by_prefix(self.cache_policy.list_invalidation_prefix())

        if warning:
            logger.info("Event created with warning: %s", warning)

        return CreateEventResult(event=saved_event, warning=warning)
