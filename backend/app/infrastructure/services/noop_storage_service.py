"""Null Object implementation of StorageService. No-op for all operations."""

from app.application.dto import ImageInput
from app.application.ports.storage_service import StorageService


class NoOpStorageService(StorageService):
    """Storage that does nothing. save_image returns empty string; delete_image no-op."""

    def save_image(self, image: ImageInput, folder: str) -> str:
        return ""

    def delete_image(self, path: str) -> None:
        pass
