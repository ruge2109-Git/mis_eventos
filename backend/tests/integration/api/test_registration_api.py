from datetime import datetime, timedelta

import pytest
from fastapi import status


class TestRegistrationAPI:
    @pytest.fixture
    def created_event_id(self, client, organizer_auth_headers):
        now = datetime.utcnow()
        resp = client.post(
            "/events/",
            json={
                "title": "Reg Event",
                "capacity": 10,
                "start_date": (now + timedelta(days=1)).isoformat(),
                "end_date": (now + timedelta(days=1, hours=2)).isoformat(),
            },
            headers=organizer_auth_headers,
        )
        assert resp.status_code == 201
        event_id = resp.json()["id"]
        # Must be published to allow registration
        pub_resp = client.post(
            f"/events/{event_id}/publish", headers=organizer_auth_headers
        )
        assert pub_resp.status_code == 200
        return event_id

    def test_register_to_event_success(
        self, client, attendee_auth_headers, created_event_id
    ):
        response = client.post(
            "/registrations/",
            json={"event_id": created_event_id},
            headers=attendee_auth_headers,
        )
        assert response.status_code == status.HTTP_201_CREATED
        assert response.json()["event_id"] == created_event_id

    def test_register_twice_fails(
        self, client, attendee_auth_headers, created_event_id
    ):
        client.post(
            "/registrations/",
            json={"event_id": created_event_id},
            headers=attendee_auth_headers,
        )
        response = client.post(
            "/registrations/",
            json={"event_id": created_event_id},
            headers=attendee_auth_headers,
        )
        assert response.status_code == status.HTTP_409_CONFLICT

    def test_unregister_success(self, client, attendee_auth_headers, created_event_id):
        client.post(
            "/registrations/",
            json={"event_id": created_event_id},
            headers=attendee_auth_headers,
        )
        response = client.delete(
            f"/registrations/event/{created_event_id}", headers=attendee_auth_headers
        )
        assert response.status_code == status.HTTP_204_NO_CONTENT

    def test_list_my_registrations(
        self, client, attendee_auth_headers, created_event_id
    ):
        reg_resp = client.post(
            "/registrations/",
            json={"event_id": created_event_id},
            headers=attendee_auth_headers,
        )
        user_id = reg_resp.json()["user_id"]
        response = client.get(
            f"/registrations/user/{user_id}", headers=attendee_auth_headers
        )
        assert response.status_code == status.HTTP_200_OK
        assert len(response.json()) >= 1
