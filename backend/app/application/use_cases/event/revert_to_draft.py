from app.application.ports.cache_service import CacheService
from app.application.ports.event_cache_policy import EventCachePolicy
from app.application.ports.event_repository import EventRepository
from app.domain.entities.event import Event
from app.domain.exceptions import ResourceNotFoundError


class RevertEventToDraftUseCase:
    def __init__(
        self,
        event_repo: EventRepository,
        cache: CacheService,
        cache_policy: EventCachePolicy,
    ):
        self.event_repo = event_repo
        self.cache = cache
        self.cache_policy = cache_policy

    def execute(self, event_id: int) -> Event:
        event = self.event_repo.get_by_id(event_id)
        if not event:
            raise ResourceNotFoundError(f"Event with ID {event_id} not found")

        event.revert_to_draft()
        updated_event = self.event_repo.save(event)

        self.cache.delete_by_prefix(self.cache_policy.list_invalidation_prefix())
        self.cache.delete(self.cache_policy.event_key(event_id))

        return updated_event
