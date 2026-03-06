import pytest
from fastapi import status
from app.domain.entities.user import UserRole

class TestAuthAPI:
    def test_register_attendee(self, client):
        response = client.post(
            "/auth/register",
            json={
                "email": "test@example.com",
                "full_name": "Test User",
                "password": "Password123!",
                "role": UserRole.ATTENDEE
            }
        )
        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert data["email"] == "test@example.com"
        assert "id" in data
        assert "message" in data

    def test_register_admin_refused(self, client):
        # Admins cannot register through public endpoint
        response = client.post(
            "/auth/register",
            json={
                "email": "admin@example.com",
                "full_name": "Admin",
                "password": "Password123!",
                "role": UserRole.ADMIN
            }
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_login_success(self, client):
        # Clear/Setup: First register
        client.post(
            "/auth/register",
            json={
                "email": "login@example.com",
                "full_name": "Login User",
                "password": "Password123!",
                "role": UserRole.ATTENDEE
            }
        )
        
        # Then login
        response = client.post(
            "/auth/login",
            json={
                "email": "login@example.com",
                "password": "Password123!"
            }
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"

    def test_login_invalid_credentials(self, client):
        response = client.post(
            "/auth/login",
            json={
                "email": "wrong@example.com",
                "password": "password"
            }
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
