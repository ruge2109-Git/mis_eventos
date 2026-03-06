import pytest
from datetime import datetime, timedelta
from fastapi import status

class TestEventAPI:
    def test_create_event_success(self, client, organizer_auth_headers):
        now = datetime.utcnow()
        response = client.post(
            "/events/",
            json={
                "title": "Integration Event",
                "capacity": 50,
                "start_date": (now + timedelta(days=1)).isoformat(),
                "end_date": (now + timedelta(days=1, hours=2)).isoformat(),
                "location": "Virtual Room",
                "description": "Integration testing event"
            },
            headers=organizer_auth_headers
        )
        assert response.status_code == status.HTTP_201_CREATED
        assert response.json()["title"] == "Integration Event"

    def test_list_events(self, client):
        response = client.get("/events/")
        assert response.status_code == status.HTTP_200_OK
        assert isinstance(response.json(), list)

    def test_get_event_not_found(self, client):
        response = client.get("/events/9999")
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_create_event_forbidden_for_attendee(self, client, attendee_auth_headers):
        now = datetime.utcnow()
        response = client.post(
            "/events/",
            json={
                "title": "Should Fail",
                "capacity": 50,
                "start_date": (now + timedelta(days=1)).isoformat(),
                "end_date": (now + timedelta(days=1, hours=2)).isoformat()
            },
            headers=attendee_auth_headers
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN
