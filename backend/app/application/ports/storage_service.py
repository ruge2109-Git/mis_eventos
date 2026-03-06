from abc import ABC, abstractmethod

from fastapi import UploadFile


class StorageService(ABC):
    @abstractmethod
    def save_image(self, file: UploadFile, folder: str) -> str:
        """
        Saves an image, optimizes it (WebP), and returns the public URL/path.
        """
        pass

    @abstractmethod
    def delete_image(self, path: str) -> None:
        """
        Deletes an image from storage.
        """
        pass
