import dataclasses
from datetime import datetime

from fastapi import UploadFile

from app.application.ports.cache_service import CacheService
from app.application.ports.event_repository import EventRepository
from app.application.ports.storage_service import StorageService
from app.domain.entities.event import Event
from app.domain.exceptions import EventOverlapError, InvalidEventStateError, ResourceNotFoundError
from app.infrastructure.config.logging import logger


class CreateEventResult:
    def __init__(self, event: Event, warning: str | None = None):
        self.event = event
        self.warning = warning


class EventUseCases:
    def __init__(
        self,
        event_repo: EventRepository,
        storage: StorageService | None = None,
        cache: CacheService | None = None,
    ):
        self.event_repo = event_repo
        self.storage = storage
        self.cache = cache

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
        self._validate_event_dates(start_date, end_date)
        warning = self._check_overlaps(start_date, end_date, location)

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

        # Invalidate cache
        if self.cache:
            self.cache.delete("events_paginated_list")

        if warning:
            logger.info(f"Event created with warning: {warning}")

        return CreateEventResult(event=saved_event, warning=warning)

    def update_event_image(self, event_id: int, file: UploadFile) -> Event:
        event = self.event_repo.get_by_id(event_id)
        if not event:
            raise ResourceNotFoundError(f"Event with ID {event_id} not found")

        if not self.storage:
            raise Exception("Storage service not configured")

        if event.image_url:
            self.storage.delete_image(event.image_url)

        image_url = self.storage.save_image(file, folder="events")

        event.image_url = image_url
        updated_event = self.event_repo.save(event)

        if self.cache:
            self.cache.delete("events_list")
            self.cache.delete(f"event_{event_id}")

        return updated_event

    def publish_event(self, event_id: int) -> Event:
        event = self.event_repo.get_by_id(event_id)
        if not event:
            raise ResourceNotFoundError(f"Event with ID {event_id} not found")

        event.publish()
        updated_event = self.event_repo.save(event)

        if self.cache:
            self.cache.delete("events_list")
            self.cache.delete(f"event_{event_id}")

        return updated_event

    def cancel_event(self, event_id: int) -> Event:
        event = self.event_repo.get_by_id(event_id)
        if not event:
            raise ResourceNotFoundError(f"Event with ID {event_id} not found")

        event.cancel()
        updated_event = self.event_repo.save(event)

        if self.cache:
            self.cache.delete("events_list")
            self.cache.delete(f"event_{event_id}")

        return updated_event

    def get_event(self, event_id: int) -> Event | None:
        cache_key = f"event_{event_id}"
        if self.cache:
            cached = self.cache.get(cache_key)
            if cached:
                return Event(**cached)

        event = self.event_repo.get_by_id(event_id)

        if event and self.cache:
            self.cache.set(cache_key, dataclasses.asdict(event), expire_seconds=600)

        return event

    def list_events(
        self,
        skip: int = 0,
        limit: int = 100,
        search: str | None = None,
        status: str | None = None,
        organizer_id: int | None = None,
    ) -> tuple[list[Event], int]:
        cache_key = f"events_paginated_list_{skip}_{limit}_{search}_{status}_{organizer_id}"
        if self.cache and organizer_id is None:
            cached = self.cache.get(cache_key)
            if cached:
                return [Event(**e) for e in cached["items"]], cached["total"]

        events, total = self.event_repo.list_all(
            skip=skip, limit=limit, search=search, status=status, organizer_id=organizer_id
        )

        if self.cache:
            cache_data = {
                "items": [dataclasses.asdict(e) for e in events],
                "total": total
            }
            self.cache.set(cache_key, cache_data, expire_seconds=300)

        return events, total

    def _validate_event_dates(self, start_date: datetime, end_date: datetime):
        if end_date <= start_date:
            raise InvalidEventStateError("The end date must be after the start date")

    def _check_overlaps(
        self, start_date: datetime, end_date: datetime, location: str | None = None
    ) -> str | None:
        overlapping_events = self.event_repo.find_overlapping(start_date, end_date)
        warning = None
        for other in overlapping_events:
            if (
                location
                and other.location
                and location.lower().strip() == other.location.lower().strip()
            ):
                raise EventOverlapError(
                    f"Location conflict: '{location}' is already occupied by event '{other.title}'"
                )

            if not warning:
                warning = (
                    f"Note: There is at least one other event ('{other.title}') "
                    "scheduled during this time frame."
                )

        return warning
