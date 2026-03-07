from datetime import datetime

from app.application.ports.event_repository import EventRepository
from app.domain.exceptions import EventOverlapError, InvalidEventStateError


def validate_event_dates(start_date: datetime, end_date: datetime) -> None:
    if end_date <= start_date:
        raise InvalidEventStateError("The end date must be after the start date")


def check_overlaps(
    event_repo: EventRepository,
    start_date: datetime,
    end_date: datetime,
    location: str | None = None,
    exclude_id: int | None = None,
) -> str | None:
    overlapping_events = event_repo.find_overlapping(
        start_date, end_date, exclude_id=exclude_id
    )
    warning = None
    for other in overlapping_events:
        if (
            location
            and other.location
            and location.lower().strip() == other.location.lower().strip()
        ):
            raise EventOverlapError(
                f"Location conflict: '{location}' is already occupied by event '{other.title}'"
            )

        if not warning:
            warning = (
                f"Note: There is at least one other event ('{other.title}') "
                "scheduled during this time frame."
            )

    return warning
