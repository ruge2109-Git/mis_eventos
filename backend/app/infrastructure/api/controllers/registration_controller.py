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
