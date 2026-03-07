"""DTO for image upload input. Keeps the application layer free of HTTP/framework types."""

from dataclasses import dataclass


@dataclass(frozen=True)
class ImageInput:
    """Binary image content and metadata. Built from UploadFile in the controller."""

    content: bytes
    filename: str
