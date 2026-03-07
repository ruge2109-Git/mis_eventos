from datetime import datetime, timedelta

import pytest
from fastapi import status


class TestSessionRegistrationAPI:
    @pytest.fixture
    def setup_data(self, client, organizer_auth_headers):
        # 1. Create and publish Event
        now = datetime.utcnow()
        resp = client.post(
            "/events/",
            json={
                "title": "Conf",
                "capacity": 100,
                "start_date": (now + timedelta(days=1)).isoformat(),
                "end_date": (now + timedelta(days=2)).isoformat(),
            },
            headers=organizer_auth_headers,
        )
        assert resp.status_code == 201
        event_id = resp.json()["id"]
        client.post(f"/events/{event_id}/publish", headers=organizer_auth_headers)

        # 2. Create Session
        sess_resp = client.post(
            "/sessions/",
            json={
                "title": "Workshop",
                "start_time": (now + timedelta(days=1, hours=1)).isoformat(),
                "end_time": (now + timedelta(days=1, hours=2)).isoformat(),
                "speaker": "Speaker",
                "capacity": 10,
                "event_id": event_id,
            },
            headers=organizer_auth_headers,
        )
        assert sess_resp.status_code == 201
        session_id = sess_resp.json()["id"]

        return {"event_id": event_id, "session_id": session_id}

    def test_register_session_success(self, client, attendee_auth_headers, setup_data):
        # First register for event
        client.post(
            "/registrations/",
            json={"event_id": setup_data["event_id"]},
            headers=attendee_auth_headers,
        )

        # Then register for session
        response = client.post(
            "/session-registrations/",
            json={"session_id": setup_data["session_id"]},
            headers=attendee_auth_headers,
        )
        assert response.status_code == status.HTTP_201_CREATED
        assert response.json()["session_id"] == setup_data["session_id"]

    def test_unregister_session_success(
        self, client, attendee_auth_headers, setup_data
    ):
        client.post(
            "/registrations/",
            json={"event_id": setup_data["event_id"]},
            headers=attendee_auth_headers,
        )
        client.post(
            "/session-registrations/",
            json={"session_id": setup_data["session_id"]},
            headers=attendee_auth_headers,
        )

        response = client.delete(
            f"/session-registrations/{setup_data['session_id']}",
            headers=attendee_auth_headers,
        )
        assert response.status_code == status.HTTP_204_NO_CONTENT

    def test_list_user_sessions(self, client, attendee_auth_headers, setup_data):
        reg = client.post(
            "/registrations/",
            json={"event_id": setup_data["event_id"]},
            headers=attendee_auth_headers,
        )
        user_id = reg.json()["user_id"]
        client.post(
            "/session-registrations/",
            json={"session_id": setup_data["session_id"]},
            headers=attendee_auth_headers,
        )

        response = client.get(
            f"/session-registrations/user/{user_id}", headers=attendee_auth_headers
        )
        assert response.status_code == status.HTTP_200_OK
        assert len(response.json()) >= 1
