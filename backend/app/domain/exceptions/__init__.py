class DomainException(Exception):
    """Base exception for domain errors."""

    def __init__(self, message: str):
        self.message = message
        super().__init__(self.message)


class ResourceNotFoundError(DomainException):
    """Raised when a requested resource is not found."""

    pass


class ResourceAlreadyExistsError(DomainException):
    """Raised when a resource being created already exists."""

    pass


class AuthenticationError(DomainException):
    """Raised when authentication fails."""

    pass


class AuthorizationError(DomainException):
    """Raised when a user lacks permission for an operation."""

    pass


class EventCapacityExceededError(DomainException):
    """Raised when trying to register for an event that is full."""

    pass


class SessionOverlapError(DomainException):
    """Raised when a user tries to register for overlapping sessions."""

    pass


class EventOverlapError(DomainException):
    """Raised when two events share the same time frame."""

    pass


class InvalidEventStateError(DomainException):
    """Raised when an operation is performed on an event in an invalid state."""

    pass


class StorageNotAvailableError(DomainException):
    """Raised when the storage service is not configured or unavailable."""

    pass
