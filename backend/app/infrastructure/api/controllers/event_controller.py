import dataclasses
from datetime import datetime

from fastapi import UploadFile

from app.application.use_cases.event_use_cases import EventUseCases


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
    ):
        result = self.event_use_cases.create_event(
            title=title,
            capacity=capacity,
            start_date=start_date,
            end_date=end_date,
            organizer_id=organizer_id,
            location=location,
            description=description,
        )

        response_data = dataclasses.asdict(result.event)
        if result.warning:
            response_data["warning"] = result.warning

        return response_data

    def upload_image(self, event_id: int, file: UploadFile):
        return self.event_use_cases.update_event_image(event_id, file)

    def list_events(
        self,
        skip: int,
        limit: int,
        search: str | None,
        status: str | None = None,
        organizer_id: int | None = None,
    ):
        events, total = self.event_use_cases.list_events(
            skip=skip, limit=limit, search=search, status=status, organizer_id=organizer_id
        )

        return {
            "items": [dataclasses.asdict(e) for e in events],
            "total": total
        }

    def get_event(self, event_id: int):
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
    ):
        updated = self.event_use_cases.update_event(
            event_id,
            title=title,
            capacity=capacity,
            start_date=start_date,
            end_date=end_date,
            location=location,
            description=description,
            additional_images=additional_images,
        )
        return dataclasses.asdict(updated)

    def upload_additional_image(self, event_id: int, file: UploadFile):
        updated = self.event_use_cases.add_event_additional_image(event_id, file)
        return dataclasses.asdict(updated)

    def publish_event(self, event_id: int):
        return self.event_use_cases.publish_event(event_id)

    def cancel_event(self, event_id: int):
        return self.event_use_cases.cancel_event(event_id)

    def revert_event_to_draft(self, event_id: int):
        return dataclasses.asdict(self.event_use_cases.revert_event_to_draft(event_id))

    def delete_event(self, event_id: int) -> None:
        self.event_use_cases.delete_event(event_id)
