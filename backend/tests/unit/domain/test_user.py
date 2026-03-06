from app.domain.entities.user import User, UserRole

class TestUserEntity:
    def test_user_is_admin(self):
        user = User(
            email="admin@test.com",
            full_name="Admin",
            hashed_password="...",
            role=UserRole.ADMIN
        )
        assert user.is_admin() is True
        assert user.is_attendee() is False
        assert user.is_organizer() is False

    def test_user_is_attendee(self):
        user = User(
            email="user@test.com",
            full_name="User",
            hashed_password="...",
            role=UserRole.ATTENDEE
        )
        assert user.is_admin() is False
        assert user.is_attendee() is True
        assert user.is_organizer() is False

    def test_user_is_organizer(self):
        user = User(
            email="org@test.com",
            full_name="Org",
            hashed_password="...",
            role=UserRole.ORGANIZER
        )
        assert user.is_admin() is False
        assert user.is_attendee() is False
        assert user.is_organizer() is True
