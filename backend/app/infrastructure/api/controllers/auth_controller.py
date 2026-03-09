from app.application.dto import LoginResponse, RegisterResponse
from app.application.use_cases.user_use_cases import UserUseCases
from app.domain.entities.user import UserRole
from app.infrastructure.api.security.jwt_handler import create_access_token


class AuthController:
    def __init__(self, user_use_cases: UserUseCases):
        self.user_use_cases = user_use_cases

    def register(
        self, email: str, full_name: str, password: str, role: UserRole
    ) -> RegisterResponse:
        user = self.user_use_cases.register_user(
            email=email, full_name=full_name, password=password, role=role
        )
        return RegisterResponse(
            id=user.id,
            email=user.email,
            message="User registered successfully",
        )

    def login(self, email: str, password: str) -> LoginResponse:
        user = self.user_use_cases.authenticate_user(email, password)
        access_token = create_access_token(data={"sub": user.email})
        return LoginResponse(
            access_token=access_token,
            token_type="bearer",
            user_id=user.id,
            role=user.role,
            full_name=user.full_name,
        )
