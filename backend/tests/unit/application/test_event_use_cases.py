import pytest
from datetime import datetime, timedelta
from unittest.mock import MagicMock
from app.application.use_cases.event_use_cases import EventUseCases, CreateEventResult
from app.domain.entities.event import Event, EventStatus
from app.domain.exceptions import InvalidEventStateError, ResourceNotFoundError, EventOverlapError

class TestEventUseCases:
    @pytest.fixture
    def mock_repos(self, mocker):
        return {
            "event_repo": mocker.Mock(),
            "storage": mocker.Mock(),
            "cache": mocker.Mock()
        }

    @pytest.fixture
    def use_cases(self, mock_repos):
        return EventUseCases(
            event_repo=mock_repos["event_repo"],
            storage=mock_repos["storage"],
            cache=mock_repos["cache"]
        )

    def test_create_event_invalid_dates(self, use_cases):
        now = datetime.utcnow()
        with pytest.raises(InvalidEventStateError, match="The end date must be after the start date"):
            use_cases.create_event(
                title="T", capacity=10, 
                start_date=now + timedelta(hours=2), 
                end_date=now + timedelta(hours=1),
                organizer_id=1
            )

    def test_create_event_location_overlap(self, use_cases, mock_repos):
        now = datetime.utcnow()
        start = now + timedelta(hours=1)
        end = now + timedelta(hours=2)
        
        mock_repos["event_repo"].find_overlapping.return_value = [
            Event(title="Other", capacity=10, start_date=start, end_date=end, organizer_id=2, location="Room A")
        ]
        
        with pytest.raises(EventOverlapError, match="Location conflict"):
            use_cases.create_event(
                title="T", capacity=10, start_date=start, end_date=end,
                organizer_id=1, location="Room A"
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
            title="T", capacity=10, start_date=start, end_date=end,
            organizer_id=1, location="Room A"
        )
        
        assert "Note: There is at least one other event" in result.warning
        assert result.event.title == "T"

    def test_update_event_image_success(self, use_cases, mock_repos):
        event = Event(title="T", capacity=10, start_date=datetime.utcnow(), 
                      end_date=datetime.utcnow() + timedelta(hours=1), organizer_id=1, id=1, image_url="old.jpg")
        mock_repos["event_repo"].get_by_id.return_value = event
        mock_repos["storage"].save_image.return_value = "new.webp"
        mock_repos["event_repo"].save.side_effect = lambda x: x
        
        mock_file = MagicMock()
        result = use_cases.update_event_image(1, mock_file)
        
        assert result.image_url == "new.webp"
        mock_repos["storage"].delete_image.assert_called_with("old.jpg")
        mock_repos["cache"].delete.assert_called()

    def test_update_event_image_not_found(self, use_cases, mock_repos):
        mock_repos["event_repo"].get_by_id.return_value = None
        with pytest.raises(ResourceNotFoundError):
            use_cases.update_event_image(1, MagicMock())

    def test_update_event_image_no_storage(self, mock_repos):
        # Case where storage service is None
        uc = EventUseCases(event_repo=mock_repos["event_repo"], storage=None)
        mock_repos["event_repo"].get_by_id.return_value = MagicMock()
        with pytest.raises(Exception, match="Storage service not configured"):
            uc.update_event_image(1, MagicMock())

    def test_publish_event_success(self, use_cases, mock_repos):
        event = Event(title="T", capacity=10, start_date=datetime.utcnow(), 
                      end_date=datetime.utcnow() + timedelta(hours=1), organizer_id=1, status=EventStatus.DRAFT, id=1)
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
        event = Event(title="T", capacity=10, start_date=datetime.utcnow(), 
                      end_date=datetime.utcnow() + timedelta(hours=1), organizer_id=1, status=EventStatus.PUBLISHED, id=1)
        mock_repos["event_repo"].get_by_id.return_value = event
        mock_repos["event_repo"].save.return_value = event
        
        result = use_cases.cancel_event(1)
        assert result.status == EventStatus.CANCELLED

    def test_get_event_not_cached(self, use_cases, mock_repos):
        mock_repos["cache"].get.return_value = None
        event = Event(title="DB", capacity=10, start_date=datetime.utcnow(), 
                      end_date=datetime.utcnow() + timedelta(hours=1), organizer_id=1, id=1)
        mock_repos["event_repo"].get_by_id.return_value = event
        
        result = use_cases.get_event(1)
        assert result.title == "DB"
        mock_repos["cache"].set.assert_called()

    def test_get_event_cached(self, use_cases, mock_repos):
        now = datetime.utcnow()
        cached_data = {
            "title": "Cached", "capacity": 10, 
            "start_date": now.isoformat(), "end_date": (now + timedelta(hours=1)).isoformat(), 
            "organizer_id": 1, "id": 1, "status": "Published", "location": "Room X", "description": "D"
        }
        mock_repos["cache"].get.return_value = cached_data
        
        event = use_cases.get_event(1)
        assert event.title == "Cached"
        mock_repos["event_repo"].get_by_id.assert_not_called()

    def test_list_events_no_cache(self, use_cases, mock_repos):
        mock_repos["cache"].get.return_value = None
        mock_repos["event_repo"].list_all.return_value = [
            Event(title="E1", capacity=10, start_date=datetime.utcnow(), end_date=datetime.utcnow() + timedelta(hours=1), organizer_id=1)
        ]
        result = use_cases.list_events()
        assert len(result) == 1
        mock_repos["cache"].set.assert_called()

    def test_list_events_cached(self, use_cases, mock_repos):
        now = datetime.utcnow()
        cached_data = [{
            "title": "Cached List", "capacity": 10, 
            "start_date": now.isoformat(), "end_date": (now + timedelta(hours=1)).isoformat(), 
            "organizer_id": 1, "id": 1
        }]
        mock_repos["cache"].get.return_value = cached_data
        
        result = use_cases.list_events()
        assert len(result) == 1
        assert result[0].title == "Cached List"
        mock_repos["event_repo"].list_all.assert_not_called()
