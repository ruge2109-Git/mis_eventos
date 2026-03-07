import pytest

from app.domain.exceptions import (
    AuthenticationError,
    AuthorizationError,
    EventCapacityExceededError,
    ResourceAlreadyExistsError,
    ResourceNotFoundError,
    StorageNotAvailableError,
)
from app.infrastructure.api.middleware.error_handler import (
    domain_exception_handler,
    global_exception_handler,
    image_processing_exception_handler,
)
from app.infrastructure.exceptions import ImageProcessingError


class DummyRequest:
    def __init__(self):
        self.url = "http://testserver/"

@pytest.mark.asyncio
async def test_domain_exception_handler():
    request = DummyRequest()

    # Test 404
    exc = ResourceNotFoundError("Not found")
    response = await domain_exception_handler(request, exc)
    assert response.status_code == 404
    import json
    body = json.loads(response.body)
    assert body["detail"] == "Not found"

    # Test 409
    exc = ResourceAlreadyExistsError("Conflict")
    response = await domain_exception_handler(request, exc)
    assert response.status_code == 409

    # Test 401
    exc = AuthenticationError("Auth error")
    response = await domain_exception_handler(request, exc)
    assert response.status_code == 401

    # Test 403
    exc = AuthorizationError("Authz error")
    response = await domain_exception_handler(request, exc)
    assert response.status_code == 403

    # Test 400
    exc = EventCapacityExceededError("Capacity error")
    response = await domain_exception_handler(request, exc)
    assert response.status_code == 400

    # Test 503
    exc = StorageNotAvailableError("Storage not configured")
    response = await domain_exception_handler(request, exc)
    assert response.status_code == 503


@pytest.mark.asyncio
async def test_image_processing_exception_handler():
    request = DummyRequest()
    exc = ImageProcessingError("Failed to process image")
    response = await image_processing_exception_handler(request, exc)
    assert response.status_code == 422
    import json
    body = json.loads(response.body)
    assert body["detail"] == "Failed to process image"
    assert body["error_type"] == "ImageProcessingError"


@pytest.mark.asyncio
async def test_global_exception_handler():
    request = DummyRequest()
    exc = Exception("Some system error")
    response = await global_exception_handler(request, exc)
    assert response.status_code == 500
    import json
    body = json.loads(response.body)
    assert "unexpected error" in body["detail"]
