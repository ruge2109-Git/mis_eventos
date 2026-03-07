"""List events with organizer email/name in one query (admin)."""
from app.application.dto.event_with_organizer import EventWithOrganizer
from app.application.ports.event_repository import EventRepository


class ListEventsWithOrganizerUseCase:
    def __init__(self, event_repo: EventRepository):
        self.event_repo = event_repo

    def execute(
        self,
        skip: int = 0,
        limit: int = 100,
        search: str | None = None,
        status: str | None = None,
        organizer_id: int | None = None,
    ) -> tuple[list[EventWithOrganizer], int]:
        return self.event_repo.list_all_with_organizer(
            skip=skip,
            limit=limit,
            search=search,
            status=status,
            organizer_id=organizer_id,
        )
