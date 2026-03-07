from abc import ABC, abstractmethod

from app.application.dto import ImageInput


class StorageService(ABC):
    @abstractmethod
    def save_image(self, image: ImageInput, folder: str) -> str:
        """
        Saves an image (content as bytes), optimizes
        it (e.g. WebP), and returns the public URL/path.
        """
        pass

    @abstractmethod
    def delete_image(self, path: str) -> None:
        """
        Deletes an image from storage.
        """
        pass
