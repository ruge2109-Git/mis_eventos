from sqlmodel import create_engine, Session
from app.infrastructure.config.settings import settings

database_url = settings.DATABASE_URL
DATABASE_URL = database_url
if database_url.startswith("postgresql://"):
    database_url = database_url.replace("postgresql://", "postgresql+psycopg2://", 1)

engine = create_engine(database_url, echo=settings.DEBUG)

def get_session():
    with Session(engine) as session:
        yield session
