class ImageProcessingError(Exception):
    """Raised when image processing (resize, convert, save) fails."""

    def __init__(self, message: str):
        self.message = message
        super().__init__(self.message)
