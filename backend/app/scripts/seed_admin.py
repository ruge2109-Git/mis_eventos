from sqlmodel import Session

from app.infrastructure.config.database import engine
from app.infrastructure.database.seeding import seed_admin_user


def main():
    with Session(engine) as session:
        seed_admin_user(session)


if __name__ == "__main__":
    main()
