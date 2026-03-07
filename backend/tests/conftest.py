import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, SQLModel, create_engine
from sqlmodel.pool import StaticPool

from app.infrastructure.api.dependencies.provider import get_session
from app.infrastructure.api.main import app


@pytest.fixture(name="session")
def session_fixture():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        yield session

@pytest.fixture(name="client")
def client_fixture(session: Session):
    def get_session_override():
        return session

    app.dependency_overrides[get_session] = get_session_override
    client = TestClient(app)
    yield client
    app.dependency_overrides.clear()

@pytest.fixture
def attendee_token(client):
    reg_resp = client.post("/auth/register", json={
        "email": "att@test.com", "full_name": "Att", "password": "Password1!", "role": "Attendee"
    })
    assert reg_resp.status_code == 201, f"Attendee registration failed: {reg_resp.text}"
    resp = client.post("/auth/login", json={"email": "att@test.com", "password": "Password1!"})
    assert resp.status_code == 200, f"Attendee login failed: {resp.text}"
    return resp.json()["access_token"]

@pytest.fixture
def organizer_token(client):
    reg_resp = client.post("/auth/register", json={
        "email": "org@test.com", "full_name": "Org", "password": "Password1!", "role": "Organizer"
    })
    assert reg_resp.status_code == 201, f"Organizer registration failed: {reg_resp.text}"
    resp = client.post("/auth/login", json={"email": "org@test.com", "password": "Password1!"})
    assert resp.status_code == 200, f"Organizer login failed: {resp.text}"
    return resp.json()["access_token"]

@pytest.fixture
def attendee_auth_headers(attendee_token):
    return {"Authorization": f"Bearer {attendee_token}"}

@pytest.fixture
def organizer_auth_headers(organizer_token):
    return {"Authorization": f"Bearer {organizer_token}"}
