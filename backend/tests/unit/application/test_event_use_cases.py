from datetime import datetime, timedelta
from unittest.mock import MagicMock

import pytest

from app.application.dto import ImageInput
from app.application.use_cases.event_use_cases import EventUseCases
from app.domain.entities.event import Event, EventStatus
from app.domain.exceptions import (
    EventOverlapError,
    InvalidEventStateError,
    ResourceNotFoundError,
)
from app.infrastructure.services.event_cache_policy import DefaultEventCachePolicy


class TestEventUseCases:
    @pytest.fixture
    def mock_repos(self, mocker):
        return {
            "event_repo": mocker.Mock(),
            "storage": mocker.Mock(),
            "cache": mocker.Mock(),
        }

    @pytest.fixture
    def use_cases(self, mock_repos):
        return EventUseCases(
            event_repo=mock_repos["event_repo"],
            storage=mock_repos["storage"],
            cache=mock_repos["cache"],
            cache_policy=DefaultEventCachePolicy(),
        )

    def test_create_event_invalid_dates(self, use_cases):
        now = datetime.utcnow()
        with pytest.raises(
            InvalidEventStateError, match="The end date must be after the start date"
        ):
            use_cases.create_event(
                title="T",
                capacity=10,
                start_date=now + timedelta(hours=2),
                end_date=now + timedelta(hours=1),
                organizer_id=1,
            )

    def test_create_event_location_overlap(self, use_cases, mock_repos):
        now = datetime.utcnow()
        start = now + timedelta(hours=1)
        end = now + timedelta(hours=2)

        mock_repos["event_repo"].find_overlapping.return_value = [
            Event(
                title="Other",
                capacity=10,
                start_date=start,
                end_date=end,
                organizer_id=2,
                location="Room A",
            )
        ]

        with pytest.raises(EventOverlapError, match="Location conflict"):
            use_cases.create_event(
                title="T",
                capacity=10,
                start_date=start,
                end_date=end,
                organizer_id=1,
                location="Room A",
            )

    def test_create_event_time_overlap_warning(self, use_cases, mock_repos):
        now = datetime.utcnow()
        start = now + timedelta(hours=1)
        end = now + timedelta(hours=2)

        mock_repos["event_repo"].find_overlapping.return_value = [
            MagicMock(title="Other", location="Room B", start_date=start, end_date=end)
        ]
        mock_repos["event_repo"].save.side_effect = lambda x: x

        result = use_cases.create_event(
            title="T",
            capacity=10,
            start_date=start,
            end_date=end,
            organizer_id=1,
            location="Room A",
        )

        assert "Note: There is at least one other event" in result.warning
        assert result.event.title == "T"

    def test_update_event_image_success(self, use_cases, mock_repos):
        event = Event(
            title="T",
            capacity=10,
            start_date=datetime.utcnow(),
            end_date=datetime.utcnow() + timedelta(hours=1),
            organizer_id=1,
            id=1,
            image_url="old.jpg",
        )
        mock_repos["event_repo"].get_by_id.return_value = event
        mock_repos["storage"].save_image.return_value = "new.webp"
        mock_repos["event_repo"].save.side_effect = lambda x: x

        image = ImageInput(content=b"fake", filename="test.jpg")
        result = use_cases.update_event_image(1, image)

        assert result.image_url == "new.webp"
        mock_repos["storage"].delete_image.assert_called_with("old.jpg")
        mock_repos["cache"].delete_by_prefix.assert_called()
        mock_repos["cache"].delete.assert_called()

    def test_update_event_image_not_found(self, use_cases, mock_repos):
        mock_repos["event_repo"].get_by_id.return_value = None
        with pytest.raises(ResourceNotFoundError):
            use_cases.update_event_image(1, ImageInput(content=b"x", filename="x"))

    def test_update_event_image_no_storage(self, mock_repos):
        # With NoOp storage, upload succeeds and image_url is empty string
        from app.infrastructure.services.noop_storage_service import NoOpStorageService

        uc = EventUseCases(
            event_repo=mock_repos["event_repo"],
            storage=NoOpStorageService(),
            cache=mock_repos["cache"],
            cache_policy=DefaultEventCachePolicy(),
        )
        event = Event(
            title="T",
            capacity=10,
            start_date=datetime.utcnow(),
            end_date=datetime.utcnow() + timedelta(hours=1),
            organizer_id=1,
            id=1,
            image_url="old.jpg",
        )
        mock_repos["event_repo"].get_by_id.return_value = event
        mock_repos["event_repo"].save.side_effect = lambda x: x

        result = uc.update_event_image(1, ImageInput(content=b"x", filename="x"))

        assert result.image_url == ""

    def test_publish_event_success(self, use_cases, mock_repos):
        event = Event(
            title="T",
            capacity=10,
            start_date=datetime.utcnow(),
            end_date=datetime.utcnow() + timedelta(hours=1),
            organizer_id=1,
            status=EventStatus.DRAFT,
            id=1,
        )
        mock_repos["event_repo"].get_by_id.return_value = event
        mock_repos["event_repo"].save.return_value = event

        result = use_cases.publish_event(1)
        assert result.status == EventStatus.PUBLISHED
        mock_repos["cache"].delete.assert_called()

    def test_publish_event_not_found(self, use_cases, mock_repos):
        mock_repos["event_repo"].get_by_id.return_value = None
        with pytest.raises(ResourceNotFoundError):
            use_cases.publish_event(1)

    def test_cancel_event_success(self, use_cases, mock_repos):
        event = Event(
            title="T",
            capacity=10,
            start_date=datetime.utcnow(),
            end_date=datetime.utcnow() + timedelta(hours=1),
            organizer_id=1,
            status=EventStatus.PUBLISHED,
            id=1,
        )
        mock_repos["event_repo"].get_by_id.return_value = event
        mock_repos["event_repo"].save.return_value = event

        result = use_cases.cancel_event(1)
        assert result.status == EventStatus.CANCELLED

    def test_get_event_not_found(self, use_cases, mock_repos):
        mock_repos["cache"].get.return_value = None
        mock_repos["event_repo"].get_by_id.return_value = None
        with pytest.raises(ResourceNotFoundError, match="Event with ID 1 not found"):
            use_cases.get_event(1)

    def test_get_event_not_cached(self, use_cases, mock_repos):
        mock_repos["cache"].get.return_value = None
        event = Event(
            title="DB",
            capacity=10,
            start_date=datetime.utcnow(),
            end_date=datetime.utcnow() + timedelta(hours=1),
            organizer_id=1,
            id=1,
        )
        mock_repos["event_repo"].get_by_id.return_value = event

        result = use_cases.get_event(1)
        assert result.title == "DB"
        mock_repos["cache"].set.assert_called()

    def test_get_event_cached(self, use_cases, mock_repos):
        now = datetime.utcnow()
        cached_data = {
            "title": "Cached",
            "capacity": 10,
            "start_date": now.isoformat(),
            "end_date": (now + timedelta(hours=1)).isoformat(),
            "organizer_id": 1,
            "id": 1,
            "status": "Published",
            "location": "Room X",
            "description": "D",
        }
        mock_repos["cache"].get.return_value = cached_data

        event = use_cases.get_event(1)
        assert event.title == "Cached"
        mock_repos["event_repo"].get_by_id.assert_not_called()

    def test_list_events_no_cache(self, use_cases, mock_repos):
        mock_repos["cache"].get.return_value = None
        mock_repos["event_repo"].list_all.return_value = (
            [
                Event(
                    title="E1",
                    capacity=10,
                    start_date=datetime.utcnow(),
                    end_date=datetime.utcnow() + timedelta(hours=1),
                    organizer_id=1,
                )
            ],
            1,
        )
        events, total = use_cases.list_events()
        assert len(events) == 1
        assert total == 1
        mock_repos["cache"].set.assert_called()

    def test_list_events_cached(self, use_cases, mock_repos):
        now = datetime.utcnow()
        cached_data = {
            "items": [
                {
                    "title": "Cached List",
                    "capacity": 10,
                    "start_date": now.isoformat(),
                    "end_date": (now + timedelta(hours=1)).isoformat(),
                    "organizer_id": 1,
                    "id": 1,
                }
            ],
            "total": 1,
        }
        mock_repos["cache"].get.return_value = cached_data

        events, total = use_cases.list_events()
        assert len(events) == 1
        assert total == 1
        assert events[0].title == "Cached List"
        mock_repos["event_repo"].list_all.assert_not_called()

    def test_delete_event_success(self, use_cases, mock_repos):
        event = Event(
            title="T",
            capacity=10,
            start_date=datetime.utcnow(),
            end_date=datetime.utcnow() + timedelta(hours=1),
            organizer_id=1,
            id=1,
            image_url="/uploads/events/cover.webp",
            additional_images=["/uploads/events/extra1.webp"],
        )
        mock_repos["event_repo"].get_by_id.return_value = event

        use_cases.delete_event(1)

        mock_repos["storage"].delete_image.assert_any_call("/uploads/events/cover.webp")
        mock_repos["storage"].delete_image.assert_any_call("/uploads/events/extra1.webp")
        mock_repos["event_repo"].delete.assert_called_once_with(1)
        mock_repos["cache"].delete_by_prefix.assert_called_with("events_paginated_list")
        mock_repos["cache"].delete.assert_called_with("event_1")

    def test_delete_event_not_found(self, use_cases, mock_repos):
        mock_repos["event_repo"].get_by_id.return_value = None
        with pytest.raises(ResourceNotFoundError, match="Event with ID 1 not found"):
            use_cases.delete_event(1)
        mock_repos["event_repo"].delete.assert_not_called()
