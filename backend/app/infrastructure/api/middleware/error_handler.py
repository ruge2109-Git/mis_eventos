from fastapi import Request
from fastapi.responses import JSONResponse

from app.domain.exceptions import (
    AuthenticationError,
    AuthorizationError,
    DomainException,
    EventCapacityExceededError,
    EventOverlapError,
    InvalidEventStateError,
    ResourceAlreadyExistsError,
    ResourceNotFoundError,
    SessionOverlapError,
    StorageNotAvailableError,
)
from app.infrastructure.config.logging import logger
from app.infrastructure.exceptions import ImageProcessingError

DOMAIN_EXCEPTION_STATUS: list[tuple[type[DomainException], int]] = [
    (ResourceNotFoundError, 404),
    (ResourceAlreadyExistsError, 409),
    (EventOverlapError, 409),
    (AuthenticationError, 401),
    (AuthorizationError, 403),
    (StorageNotAvailableError, 503),
    (EventCapacityExceededError, 400),
    (SessionOverlapError, 400),
    (InvalidEventStateError, 400),
]
DEFAULT_DOMAIN_STATUS = 400


async def domain_exception_handler(request: Request, exc: DomainException):
    status_code = DEFAULT_DOMAIN_STATUS
    for exc_type, code in DOMAIN_EXCEPTION_STATUS:
        if isinstance(exc, exc_type):
            status_code = code
            break

    logger.error("Domain error at %s: %s", request.url, exc.message)

    return JSONResponse(
        status_code=status_code,
        content={"detail": exc.message, "error_type": exc.__class__.__name__},
    )


async def image_processing_exception_handler(request: Request, exc: ImageProcessingError):
    logger.error("Image processing error at %s: %s", request.url, exc.message)
    return JSONResponse(
        status_code=422,
        content={"detail": exc.message, "error_type": "ImageProcessingError"},
    )


async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled system error at {request.url}: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "detail": "An unexpected error occurred. Please try again later.",
            "error_type": "InternalServerError",
        },
    )
