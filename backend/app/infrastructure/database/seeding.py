from app.application.use_cases.user_use_cases import UserUseCases
from app.domain.entities.user import UserRole
from app.domain.exceptions import ResourceAlreadyExistsError
from app.infrastructure.config.logging import logger
from app.infrastructure.config.settings import settings


def seed_admin_user(user_use_cases: UserUseCases) -> None:
    """
    Create the default admin user if it does not exist.
    Uses UserUseCases (application layer) instead of direct DB access.
    """
    admin_email = settings.DEFAULT_ADMIN_EMAIL
    admin_password = settings.DEFAULT_ADMIN_PASSWORD

    if not admin_password or len(admin_password) > 72:
        logger.error(
            "Default admin password is empty or too long for bcrypt (max 72 chars)"
        )
        return

    if user_use_cases.get_user_by_email(admin_email):
        logger.info("Admin user %s already exists. Skipping seed.", admin_email)
        return

    try:
        logger.info("Seeding default admin user: %s", admin_email)
        user_use_cases.register_user(
            email=admin_email,
            full_name="System Admin",
            password=admin_password,
            role=UserRole.ADMIN,
        )
        logger.info("Default admin user created successfully.")
    except ResourceAlreadyExistsError:
        logger.info("Admin user %s already exists (race). Skipping seed.", admin_email)
    except Exception as e:
        logger.exception("Unexpected error during admin seeding: %s", e)
