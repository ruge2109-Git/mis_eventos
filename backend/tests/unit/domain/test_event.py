from datetime import datetime, timedelta

from app.domain.entities.event import Event, EventStatus


class TestEventEntity:
    def test_event_publish(self):
        event = Event(
            title="Test Event",
            capacity=100,
            start_date=datetime.utcnow(),
            end_date=datetime.utcnow() + timedelta(hours=1),
            organizer_id=1,
            status=EventStatus.DRAFT
        )
        event.publish()
        assert event.status == EventStatus.PUBLISHED

    def test_event_cancel_published(self):
        event = Event(
            title="Test Event",
            capacity=100,
            start_date=datetime.utcnow(),
            end_date=datetime.utcnow() + timedelta(hours=1),
            organizer_id=1,
            status=EventStatus.PUBLISHED
        )
        event.cancel()
        assert event.status == EventStatus.CANCELLED

    def test_event_is_active(self):
        now = datetime.utcnow()
        event = Event(
            title="Active Event",
            capacity=100,
            start_date=now - timedelta(hours=1),
            end_date=now + timedelta(hours=1),
            organizer_id=1,
            status=EventStatus.PUBLISHED
        )
        assert event.is_active() is True

    def test_event_not_active_if_draft(self):
        now = datetime.utcnow()
        event = Event(
            title="Draft Event",
            capacity=100,
            start_date=now - timedelta(hours=1),
            end_date=now + timedelta(hours=1),
            organizer_id=1,
            status=EventStatus.DRAFT
        )
        assert event.is_active() is False

    def test_event_not_active_if_past(self):
        now = datetime.utcnow()
        event = Event(
            title="Past Event",
            capacity=100,
            start_date=now - timedelta(hours=5),
            end_date=now - timedelta(hours=1),
            organizer_id=1,
            status=EventStatus.PUBLISHED
        )
        assert event.is_active() is False

    def test_overlaps_with_true(self):
        now = datetime.utcnow()
        event1 = Event(
            title="Event 1",
            capacity=100,
            start_date=now,
            end_date=now + timedelta(hours=2),
            organizer_id=1
        )
        event2 = Event(
            title="Event 2",
            capacity=100,
            start_date=now + timedelta(hours=1),
            end_date=now + timedelta(hours=3),
            organizer_id=1
        )
        assert event1.overlaps_with(event2) is True

    def test_overlaps_with_false(self):
        now = datetime.utcnow()
        event1 = Event(
            title="Event 1",
            capacity=100,
            start_date=now,
            end_date=now + timedelta(hours=1),
            organizer_id=1
        )
        event2 = Event(
            title="Event 2",
            capacity=100,
            start_date=now + timedelta(hours=2),
            end_date=now + timedelta(hours=3),
            organizer_id=1
        )
        assert event1.overlaps_with(event2) is False

    def test_same_location_normalization(self):
        event1 = Event(
            title="Event 1",
            capacity=100,
            start_date=datetime.utcnow(),
            end_date=datetime.utcnow(),
            organizer_id=1,
            location=" Room A "
        )
        event2 = Event(
            title="Event 2",
            capacity=100,
            start_date=datetime.utcnow(),
            end_date=datetime.utcnow(),
            organizer_id=1,
            location="ROOM a"
        )
        assert event1.same_location(event2) is True
