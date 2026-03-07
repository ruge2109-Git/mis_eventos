from app.application.ports.cache_service import CacheService
from app.application.ports.event_cache_policy import EventCachePolicy
from app.application.ports.event_reader import EventReader
from app.application.serializers.event_cache_serializer import (
    event_from_cache_dict,
    event_to_cache_dict,
)
from app.domain.entities.event import Event


class ListEventsUseCase:
    def __init__(
        self,
        event_repo: EventReader,
        cache: CacheService,
        cache_policy: EventCachePolicy,
    ):
        self.event_repo = event_repo
        self.cache = cache
        self.cache_policy = cache_policy

    def execute(
        self,
        skip: int = 0,
        limit: int = 100,
        search: str | None = None,
        status: str | None = None,
        organizer_id: int | None = None,
    ) -> tuple[list[Event], int]:
        cache_key = self.cache_policy.list_key(
            skip, limit, search, status, organizer_id
        )
        if organizer_id is None:
            cached = self.cache.get(cache_key)
            if cached:
                items = [event_from_cache_dict(e) for e in cached["items"]]
                return items, cached["total"]

        events, total = self.event_repo.list_all(
            skip=skip, limit=limit, search=search, status=status, organizer_id=organizer_id
        )

        cache_data = {
            "items": [event_to_cache_dict(e) for e in events],
            "total": total,
        }
        self.cache.set(
            cache_key, cache_data, expire_seconds=self.cache_policy.list_ttl_seconds()
        )

        return events, total
