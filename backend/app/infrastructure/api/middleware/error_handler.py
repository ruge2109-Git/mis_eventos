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


async def domain_exception_handler(request: Request, exc: DomainException):
    status_code = 400

    if isinstance(exc, ResourceNotFoundError):
        status_code = 404
    elif isinstance(exc, ResourceAlreadyExistsError | EventOverlapError):
        status_code = 409
    elif isinstance(exc, AuthenticationError):
        status_code = 401
    elif isinstance(exc, AuthorizationError):
        status_code = 403
    elif isinstance(exc, StorageNotAvailableError):
        status_code = 503
    elif isinstance(exc, EventCapacityExceededError | SessionOverlapError | InvalidEventStateError):
        status_code = 400

    logger.error(f"Domain error at {request.url}: {exc.message}")

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
