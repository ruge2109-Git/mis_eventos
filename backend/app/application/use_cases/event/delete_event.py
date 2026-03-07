from app.application.ports.cache_service import CacheService
from app.application.ports.event_cache_policy import EventCachePolicy
from app.application.ports.event_repository import EventRepository
from app.application.ports.storage_service import StorageService
from app.domain.exceptions import ResourceNotFoundError
from app.infrastructure.config.logging import logger


class DeleteEventUseCase:
    def __init__(
        self,
        event_repo: EventRepository,
        storage: StorageService,
        cache: CacheService,
        cache_policy: EventCachePolicy,
    ):
        self.event_repo = event_repo
        self.storage = storage
        self.cache = cache
        self.cache_policy = cache_policy

    def execute(self, event_id: int) -> None:
        event = self.event_repo.get_by_id(event_id)
        if not event:
            raise ResourceNotFoundError(f"Event with ID {event_id} not found")

        if event.image_url:
            try:
                self.storage.delete_image(event.image_url)
            except Exception as e:
                logger.warning(
                    "Failed to delete event cover image %s: %s",
                    event.image_url,
                    e,
                )
        for url in event.additional_images or []:
            try:
                self.storage.delete_image(url)
            except Exception as e:
                logger.warning(
                    "Failed to delete event additional image %s: %s", url, e
                )

        self.event_repo.delete(event_id)

        self.cache.delete_by_prefix(self.cache_policy.list_invalidation_prefix())
        self.cache.delete(self.cache_policy.event_key(event_id))
