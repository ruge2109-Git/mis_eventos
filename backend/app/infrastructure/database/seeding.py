from datetime import UTC, datetime

import sqlalchemy
from sqlmodel import Session, select

from app.domain.entities.user import UserRole
from app.infrastructure.config.logging import logger
from app.infrastructure.config.settings import settings
from app.infrastructure.database.models.user_model import UserModel
from app.infrastructure.services.password_hasher import PasslibPasswordHasher


def seed_admin_user(session: Session):
    hasher = PasslibPasswordHasher()
    try:
        admin_email = settings.DEFAULT_ADMIN_EMAIL
        admin_password = settings.DEFAULT_ADMIN_PASSWORD

        if not admin_password or len(admin_password) > 72:
            logger.error("Default admin password is empty or too long for bcrypt (max 72 chars)")
            return

        statement = select(UserModel).where(UserModel.email == admin_email)
        existing_admin = session.exec(statement).first()

        if not existing_admin:
            logger.info(f"Seeding default admin user: {admin_email}")
            admin_user = UserModel(
                email=admin_email,
                full_name="System Admin",
                hashed_password=hasher.hash(admin_password),
                role=UserRole.ADMIN,
                created_at=datetime.now(UTC),
            )
            session.add(admin_user)
            session.commit()
            logger.info("Default admin user created successfully.")
        else:
            logger.info(f"Admin user {admin_email} already exists. Skipping seed.")
    except sqlalchemy.exc.ProgrammingError:
        logger.warning(
            "Could not seed admin user: Database tables not found. Please run migrations first."
        )
    except Exception as e:
        logger.error(f"Unexpected error during admin seeding: {str(e)}")
