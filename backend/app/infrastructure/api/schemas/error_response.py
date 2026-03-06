from pydantic import BaseModel, Field


class ErrorResponse(BaseModel):
    detail: str = Field(..., description="A detailed message explaining the error.")
    error_type: str = Field(..., description="The internal type of the exception that caused the error.")
