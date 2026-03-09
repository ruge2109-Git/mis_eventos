import io
import os
import uuid

from PIL import Image

from app.application.dto import ImageInput
from app.application.ports.storage_service import StorageService
from app.infrastructure.exceptions import ImageProcessingError


class LocalStorageService(StorageService):
    def __init__(self, upload_dir: str = "uploads", base_url: str = "/static"):
        self.upload_dir = upload_dir
        self.base_url = base_url
        if not os.path.exists(self.upload_dir):
            os.makedirs(self.upload_dir)

    def save_image(self, image: ImageInput, folder: str) -> str:
        target_dir = os.path.join(self.upload_dir, folder)
        if not os.path.exists(target_dir):
            os.makedirs(target_dir)

        base_name = str(uuid.uuid4())
        filename = f"{base_name}.webp"
        thumb_name = f"{base_name}_thumb.webp"

        file_path = os.path.join(target_dir, filename)
        thumb_path = os.path.join(target_dir, thumb_name)

        try:
            with Image.open(io.BytesIO(image.content)) as img:
                if img.mode in ("RGBA", "P"):
                    img = img.convert("RGB")

                main_img = img.copy()
                main_img.thumbnail((1200, 1200), Image.Resampling.LANCZOS)
                main_img.save(file_path, "WEBP", quality=80, optimize=True)

                thumb_img = img.copy()
                thumb_img.thumbnail((400, 400), Image.Resampling.LANCZOS)
                thumb_img.save(thumb_path, "WEBP", quality=70, optimize=True)

        except Exception as e:
            raise ImageProcessingError(f"Failed to process image: {str(e)}") from e

        return f"{self.base_url}/{folder}/{filename}"

    def delete_image(self, path: str) -> None:
        if path.startswith(self.base_url):
            relative_path = path.replace(self.base_url, "").lstrip("/")
            local_path = os.path.join(self.upload_dir, relative_path)

            if os.path.exists(local_path):
                os.remove(local_path)

            thumb_path = local_path.replace(".webp", "_thumb.webp")
            if os.path.exists(thumb_path):
                os.remove(thumb_path)
