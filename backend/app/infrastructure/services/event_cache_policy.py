"""Default event cache key/TTL policy (OCP: strategy is injectable)."""

from app.application.ports.event_cache_policy import EventCachePolicy


class DefaultEventCachePolicy(EventCachePolicy):
    EVENT_PREFIX = "event_"
    LIST_PREFIX = "events_paginated_list"
    EVENT_TTL = 600
    LIST_TTL = 300

    def event_key(self, event_id: int) -> str:
        return f"{self.EVENT_PREFIX}{event_id}"

    def event_ttl_seconds(self) -> int:
        return self.EVENT_TTL

    def list_key(
        self,
        skip: int,
        limit: int,
        search: str | None,
        status: str | None,
        organizer_id: int | None,
    ) -> str:
        return f"{self.LIST_PREFIX}_{skip}_{limit}_{search}_{status}_{organizer_id}"

    def list_ttl_seconds(self) -> int:
        return self.LIST_TTL

    def list_invalidation_prefix(self) -> str:
        return self.LIST_PREFIX
