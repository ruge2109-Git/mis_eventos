import sqlalchemy.exc
from sqlmodel import Session

from app.application.use_cases.user_use_cases import UserUseCases
from app.infrastructure.config.database import engine
from app.infrastructure.config.logging import logger
from app.infrastructure.database.repositories import PostgresUserRepository
from app.infrastructure.database.seeding import seed_admin_user
from app.infrastructure.services.password_hasher import PasslibPasswordHasher


def main():
    try:
        with Session(engine) as session:
            user_repo = PostgresUserRepository(session)
            password_hasher = PasslibPasswordHasher()
            use_cases = UserUseCases(user_repo, password_hasher)
            seed_admin_user(use_cases)
    except sqlalchemy.exc.ProgrammingError:
        logger.warning(
            "Could not seed admin user: Database tables not found. Please run migrations first."
        )


if __name__ == "__main__":
    main()
