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

    def list_events(self, skip: int, limit: int, search: str | None, status: str | None = None):
        events, total = self.event_use_cases.list_events(skip=skip, limit=limit, search=search, status=status)
        
        return {
            "items": [dataclasses.asdict(e) for e in events],
            "total": total
        }

    def get_event(self, event_id: int):
        return self.event_use_cases.get_event(event_id)

    def publish_event(self, event_id: int):
        return self.event_use_cases.publish_event(event_id)

    def cancel_event(self, event_id: int):
        return self.event_use_cases.cancel_event(event_id)
