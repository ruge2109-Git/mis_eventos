from app.application.dto import ImageInput
from app.application.ports.cache_service import CacheService
from app.application.ports.event_cache_policy import EventCachePolicy
from app.application.ports.event_repository import EventRepository
from app.application.ports.storage_service import StorageService
from app.domain.entities.event import Event
from app.domain.exceptions import ResourceNotFoundError


class AddEventAdditionalImageUseCase:
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

    def execute(self, event_id: int, image: ImageInput) -> Event:
        event = self.event_repo.get_by_id(event_id)
        if not event:
            raise ResourceNotFoundError(f"Event with ID {event_id} not found")
        image_url = self.storage.save_image(image, folder="events")
        event.additional_images = list(event.additional_images) + [image_url]
        updated = self.event_repo.save(event)
        self.cache.delete_by_prefix(self.cache_policy.list_invalidation_prefix())
        self.cache.delete(self.cache_policy.event_key(event_id))
        return updated
