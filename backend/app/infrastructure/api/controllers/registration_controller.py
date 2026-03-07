from app.application.use_cases.registration_use_cases import RegistrationUseCases


class RegistrationController:
    def __init__(self, registration_use_cases: RegistrationUseCases):
        self.registration_use_cases = registration_use_cases

    def register_to_event(self, user_id: int, event_id: int):
        return self.registration_use_cases.register_to_event(user_id, event_id)

    def unregister_from_event(self, user_id: int, event_id: int):
        return self.registration_use_cases.unregister_from_event(user_id, event_id)

    def get_user_registrations(self, user_id: int):
        return self.registration_use_cases.get_user_registrations(user_id)

    def get_user_registered_events(self, user_id: int):
        return self.registration_use_cases.get_user_registered_events(user_id)

    def get_user_registered_events_paginated(
        self, user_id: int, skip: int = 0, limit: int = 10, search: str | None = None
    ):
        return self.registration_use_cases.get_user_registered_events_paginated(
            user_id, skip=skip, limit=limit, search=search
        )

    def get_registration_count_for_event(self, event_id: int) -> int:
        return self.registration_use_cases.get_registration_count_for_event(event_id)

    def get_registration_counts_for_events(self, event_ids: list[int]) -> dict[int, int]:
        return self.registration_use_cases.get_registration_counts_for_events(event_ids)

    def get_attendees(self, event_id: int, skip: int = 0, limit: int = 10, search: str | None = None):
        items, total = self.registration_use_cases.list_attendees_for_event(
            event_id, skip=skip, limit=limit, search=search
        )
        return {"items": items, "total": total, "skip": skip, "limit": limit}
