import pytest
from datetime import datetime, timedelta
from fastapi import status

class TestSessionAPI:
    @pytest.fixture
    def event_id(self, client, organizer_auth_headers):
        now = datetime.utcnow()
        resp = client.post("/events/", json={
            "title": "Session Event", "capacity": 10,
            "start_date": (now + timedelta(days=1)).isoformat(),
            "end_date": (now + timedelta(days=2)).isoformat()
        }, headers=organizer_auth_headers)
        return resp.json()["id"]

    def test_create_session_success(self, client, organizer_auth_headers, event_id):
        now = datetime.utcnow()
        response = client.post(
            "/sessions/",
            json={
                "title": "Deep Dive",
                "start_time": (now + timedelta(days=1, hours=1)).isoformat(),
                "end_time": (now + timedelta(days=1, hours=2)).isoformat(),
                "speaker": "Expert A",
                "capacity": 5,
                "event_id": event_id,
                "description": "D"
            },
            headers=organizer_auth_headers
        )
        assert response.status_code == status.HTTP_201_CREATED
        assert response.json()["title"] == "Deep Dive"

    def test_list_sessions(self, client, organizer_auth_headers, event_id):
        # Create one first
        now = datetime.utcnow()
        client.post("/sessions/", json={
            "title": "S1", "start_time": (now + timedelta(days=1, hours=1)).isoformat(),
            "end_time": (now + timedelta(days=1, hours=2)).isoformat(),
            "speaker": "A", "capacity": 5, "event_id": event_id
        }, headers=organizer_auth_headers)
        
        response = client.get(f"/sessions/event/{event_id}")
        assert response.status_code == status.HTTP_200_OK
        assert len(response.json()) >= 1
