from app.application.ports.cache_service import CacheService
from app.application.ports.event_cache_policy import EventCachePolicy
from app.application.ports.event_reader import EventReader
from app.application.serializers.event_cache_serializer import (
    event_from_cache_dict,
    event_to_cache_dict,
)
from app.domain.entities.event import Event
from app.domain.exceptions import ResourceNotFoundError


class GetEventUseCase:
    def __init__(
        self,
        event_repo: EventReader,
        cache: CacheService,
        cache_policy: EventCachePolicy,
    ):
        self.event_repo = event_repo
        self.cache = cache
        self.cache_policy = cache_policy

    def execute(self, event_id: int) -> Event:
        cache_key = self.cache_policy.event_key(event_id)
        cached = self.cache.get(cache_key)
        if cached:
            return event_from_cache_dict(cached)

        event = self.event_repo.get_by_id(event_id)
        if not event:
            raise ResourceNotFoundError(f"Event with ID {event_id} not found")

        self.cache.set(
            cache_key,
            event_to_cache_dict(event),
            expire_seconds=self.cache_policy.event_ttl_seconds(),
        )

        return event
