from abc import ABC, abstractmethod

from app.application.dto import ImageInput


class StorageService(ABC):
    @abstractmethod
    def save_image(self, image: ImageInput, folder: str) -> str:
        pass

    @abstractmethod
    def delete_image(self, path: str) -> None:
        pass
