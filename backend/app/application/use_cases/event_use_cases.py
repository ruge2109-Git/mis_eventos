"""Event use cases facade."""
from datetime import datetime

from app.application.dto import ImageInput
from app.application.dto.event_with_organizer import EventWithOrganizer
from app.application.ports.cache_service import CacheService
from app.application.ports.event_cache_policy import EventCachePolicy
from app.application.ports.event_repository import EventRepository
from app.application.ports.storage_service import StorageService
from app.application.use_cases.event import (
    AddEventAdditionalImageUseCase,
    CancelEventUseCase,
    CreateEventResult,
    CreateEventUseCase,
    DeleteEventUseCase,
    GetEventUseCase,
    ListEventsUseCase,
    ListEventsWithOrganizerUseCase,
    PublishEventUseCase,
    RevertEventToDraftUseCase,
    UpdateEventImageUseCase,
    UpdateEventUseCase,
)
from app.domain.entities.event import Event

# Re-export for callers that import CreateEventResult from event_use_cases
__all__ = ["EventUseCases", "CreateEventResult"]


class EventUseCases:

    def __init__(
        self,
        event_repo: EventRepository,
        storage: StorageService,
        cache: CacheService,
        cache_policy: EventCachePolicy,
    ):
        self._event_repo = event_repo
        self._create = CreateEventUseCase(event_repo, cache, cache_policy)
        self._get = GetEventUseCase(event_repo, cache, cache_policy)
        self._list = ListEventsUseCase(event_repo, cache, cache_policy)
        self._list_with_organizer = ListEventsWithOrganizerUseCase(event_repo)
        self._update = UpdateEventUseCase(event_repo, cache, cache_policy)
        self._publish = PublishEventUseCase(event_repo, cache, cache_policy)
        self._cancel = CancelEventUseCase(event_repo, cache, cache_policy)
        self._revert_to_draft = RevertEventToDraftUseCase(
            event_repo, cache, cache_policy
        )
        self._update_image = UpdateEventImageUseCase(
            event_repo, storage, cache, cache_policy
        )
        self._add_additional_image = AddEventAdditionalImageUseCase(
            event_repo, storage, cache, cache_policy
        )
        self._delete = DeleteEventUseCase(
            event_repo, storage, cache, cache_policy
        )

    def create_event(
        self,
        title: str,
        capacity: int,
        start_date: datetime,
        end_date: datetime,
        organizer_id: int,
        location: str | None = None,
        description: str | None = None,
    ) -> CreateEventResult:
        return self._create.execute(
            title=title,
            capacity=capacity,
            start_date=start_date,
            end_date=end_date,
            organizer_id=organizer_id,
            location=location,
            description=description,
        )

    def get_event(self, event_id: int) -> Event:
        return self._get.execute(event_id)

    def list_events(
        self,
        skip: int = 0,
        limit: int = 100,
        search: str | None = None,
        status: str | None = None,
        organizer_id: int | None = None,
    ) -> tuple[list[Event], int]:
        return self._list.execute(
            skip=skip,
            limit=limit,
            search=search,
            status=status,
            organizer_id=organizer_id,
        )

    def list_events_with_organizer(
        self,
        skip: int = 0,
        limit: int = 100,
        search: str | None = None,
        status: str | None = None,
        organizer_id: int | None = None,
    ) -> tuple[list[EventWithOrganizer], int]:
        """For admin: events with organizer email and full_name (single query)."""
        return self._list_with_organizer.execute(
            skip=skip,
            limit=limit,
            search=search,
            status=status,
            organizer_id=organizer_id,
        )

    def update_event(
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
        return self._update.execute(
            event_id,
            title=title,
            capacity=capacity,
            start_date=start_date,
            end_date=end_date,
            location=location,
            description=description,
            additional_images=additional_images,
        )

    def publish_event(self, event_id: int) -> Event:
        return self._publish.execute(event_id)

    def cancel_event(self, event_id: int) -> Event:
        return self._cancel.execute(event_id)

    def revert_event_to_draft(self, event_id: int) -> Event:
        return self._revert_to_draft.execute(event_id)

    def update_event_image(self, event_id: int, image: ImageInput) -> Event:
        return self._update_image.execute(event_id, image)

    def add_event_additional_image(self, event_id: int, image: ImageInput) -> Event:
        return self._add_additional_image.execute(event_id, image)

    def delete_event(self, event_id: int) -> None:
        self._delete.execute(event_id)

    def list_upcoming_events(
        self, skip: int = 0, limit: int = 10, search: str | None = None
    ) -> tuple[list[Event], int]:
        return self._event_repo.list_upcoming(skip=skip, limit=limit, search=search)
