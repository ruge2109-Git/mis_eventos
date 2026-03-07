"""
Event controller returns domain objects (Event, CreateEventResult).
Serialization to API shape is done in the router via EventMapper (SRP).
"""
from datetime import datetime

from fastapi import UploadFile

from app.application.dto import ImageInput
from app.application.use_cases.event_use_cases import CreateEventResult, EventUseCases
from app.domain.entities.event import Event


class EventController:
    def __init__(self, event_use_cases: EventUseCases):
        self.event_use_cases = event_use_cases

    def create_event(
        self,
        title: str,
        capacity: int,
        start_date: datetime,
        end_date: datetime,
        organizer_id: int,
        location: str | None,
        description: str | None,
    ) -> CreateEventResult:
        return self.event_use_cases.create_event(
            title=title,
            capacity=capacity,
            start_date=start_date,
            end_date=end_date,
            organizer_id=organizer_id,
            location=location,
            description=description,
        )

    def upload_image(self, event_id: int, file: UploadFile) -> Event:
        content = file.file.read()
        image = ImageInput(content=content, filename=file.filename or "image")
        return self.event_use_cases.update_event_image(event_id, image)

    def list_events(
        self,
        skip: int,
        limit: int,
        search: str | None,
        status: str | None = None,
        organizer_id: int | None = None,
    ) -> tuple[list[Event], int]:
        return self.event_use_cases.list_events(
            skip=skip, limit=limit, search=search, status=status, organizer_id=organizer_id
        )

    def list_events_with_organizer(
        self,
        skip: int,
        limit: int,
        search: str | None,
        status: str | None = None,
        organizer_id: int | None = None,
    ):
        return self.event_use_cases.list_events_with_organizer(
            skip=skip, limit=limit, search=search, status=status, organizer_id=organizer_id
        )

    def get_event(self, event_id: int) -> Event:
        return self.event_use_cases.get_event(event_id)

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
        return self.event_use_cases.update_event(
            event_id,
            title=title,
            capacity=capacity,
            start_date=start_date,
            end_date=end_date,
            location=location,
            description=description,
            additional_images=additional_images,
        )

    def upload_additional_image(self, event_id: int, file: UploadFile) -> Event:
        content = file.file.read()
        image = ImageInput(content=content, filename=file.filename or "image")
        return self.event_use_cases.add_event_additional_image(event_id, image)

    def publish_event(self, event_id: int) -> Event:
        return self.event_use_cases.publish_event(event_id)

    def cancel_event(self, event_id: int) -> Event:
        return self.event_use_cases.cancel_event(event_id)

    def revert_event_to_draft(self, event_id: int) -> Event:
        return self.event_use_cases.revert_event_to_draft(event_id)

    def delete_event(self, event_id: int) -> None:
        self.event_use_cases.delete_event(event_id)
