from datetime import datetime, timedelta
from app.domain.entities.session import Session

class TestSessionEntity:
    def test_session_overlaps_with_true(self):
        now = datetime.utcnow()
        s1 = Session(
            title="S1",
            start_time=now,
            end_time=now + timedelta(hours=1),
            speaker="A",
            event_id=1
        )
        s2 = Session(
            title="S2",
            start_time=now + timedelta(minutes=30),
            end_time=now + timedelta(hours=1.5),
            speaker="B",
            event_id=1
        )
        assert s1.overlaps_with(s2) is True

    def test_session_overlaps_with_false(self):
        now = datetime.utcnow()
        s1 = Session(
            title="S1",
            start_time=now,
            end_time=now + timedelta(hours=1),
            speaker="A",
            event_id=1
        )
        s2 = Session(
            title="S2",
            start_time=now + timedelta(hours=1.5),
            end_time=now + timedelta(hours=2),
            speaker="B",
            event_id=1
        )
        assert s1.overlaps_with(s2) is False

    def test_session_same_speaker_overlap(self):
        now = datetime.utcnow()
        s1 = Session(
            title="S1", start_time=now, end_time=now + timedelta(hours=1),
            speaker="Speaker X", event_id=1
        )
        s2 = Session(
            title="S2", start_time=now + timedelta(minutes=30), end_time=now + timedelta(hours=1.5),
            speaker="Speaker X", event_id=2
        )
        assert s1.overlaps_with(s2) is True
