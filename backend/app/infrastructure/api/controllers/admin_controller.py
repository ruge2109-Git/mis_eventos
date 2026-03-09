"""
Admin controller: list users, stats, reports. Used only by admin router with RequireAdmin.
"""
from app.application.use_cases.event_use_cases import EventUseCases
from app.application.use_cases.registration_use_cases import RegistrationUseCases
from app.application.use_cases.user_use_cases import UserUseCases
from app.domain.entities.event import Event, EventStatus
from app.domain.entities.user import User


class AdminController:
    def __init__(
        self,
        user_use_cases: UserUseCases,
        event_use_cases: EventUseCases,
        registration_use_cases: RegistrationUseCases,
    ):
        self.user_use_cases = user_use_cases
        self.event_use_cases = event_use_cases
        self.registration_use_cases = registration_use_cases

    def list_users(
        self,
        skip: int = 0,
        limit: int = 100,
        search: str | None = None,
        role: str | None = None,
    ) -> tuple[list[User], int]:
        return self.user_use_cases.list_users(
            skip=skip, limit=limit, search=search, role=role
        )

    def get_user(self, user_id: int) -> User | None:
        return self.user_use_cases.get_user_by_id(user_id)

    def get_stats(self) -> dict:
        _, total_users = self.user_use_cases.list_users(skip=0, limit=0)
        _, total_events = self.event_use_cases.list_events(
            skip=0, limit=0, search=None, status=None, organizer_id=None
        )
        _, draft_count = self.event_use_cases.list_events(
            skip=0, limit=0,
            search=None, status=EventStatus.DRAFT.value, organizer_id=None
        )
        _, published_count = self.event_use_cases.list_events(
            skip=0, limit=0,
            search=None, status=EventStatus.PUBLISHED.value, organizer_id=None
        )
        _, cancelled_count = self.event_use_cases.list_events(
            skip=0, limit=0,
            search=None, status=EventStatus.CANCELLED.value, organizer_id=None
        )
        return {
            "total_users": total_users,
            "total_events": total_events,
            "events_by_status": {
                "DRAFT": draft_count,
                "PUBLISHED": published_count,
                "CANCELLED": cancelled_count,
            },
        }

    def get_top_attendees(
        self, skip: int = 0, limit: int = 10, search: str | None = None
    ) -> tuple[list[tuple[int, str, str, int]], int]:
        return self.registration_use_cases.get_top_attendees(
            skip=skip, limit=limit, search=search
        )

    def get_upcoming_events(
        self, skip: int = 0, limit: int = 10, search: str | None = None
    ) -> tuple[list[Event], int]:
        return self.event_use_cases.list_upcoming_events(
            skip=skip, limit=limit, search=search
        )
