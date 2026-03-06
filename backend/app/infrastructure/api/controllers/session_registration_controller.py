from app.application.use_cases.session_registration_use_cases import SessionRegistrationUseCases

class SessionRegistrationController:
    def __init__(self, use_cases: SessionRegistrationUseCases):
        self.use_cases = use_cases

    def register_to_session(self, user_id: int, session_id: int):
        return self.use_cases.register_to_session(user_id, session_id)

    def unregister_from_session(self, user_id: int, session_id: int):
        return self.use_cases.unregister_from_session(user_id, session_id)
