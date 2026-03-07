import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.domain.exceptions import DomainException
from app.infrastructure.api.middleware.error_handler import (
    domain_exception_handler,
    global_exception_handler,
    image_processing_exception_handler,
)
from app.infrastructure.api.routers.auth_router import router as auth_router
from app.infrastructure.api.routers.event_router import router as event_router
from app.infrastructure.api.routers.registration_router import router as registration_router
from app.infrastructure.api.routers.session_registration_router import router as session_reg_router
from app.infrastructure.api.routers.session_router import router as session_router
from app.infrastructure.config.settings import settings
from app.infrastructure.exceptions import ImageProcessingError


@asynccontextmanager
async def lifespan(app: FastAPI):
    if not os.path.exists(settings.UPLOAD_DIR):
        os.makedirs(settings.UPLOAD_DIR)

    yield


app = FastAPI(
    title=settings.APP_NAME,
    description="API for event management following Hexagonal Architecture and SOLID principles",
    version="1.0.0",
    debug=settings.DEBUG,
    lifespan=lifespan,
)

app.mount(settings.STATIC_URL, StaticFiles(directory=settings.UPLOAD_DIR), name="static")

app.add_exception_handler(DomainException, domain_exception_handler)
app.add_exception_handler(ImageProcessingError, image_processing_exception_handler)
app.add_exception_handler(Exception, global_exception_handler)

_origins = [o.strip() for o in settings.CORS_ORIGINS.split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(event_router)
app.include_router(session_router)
app.include_router(registration_router)
app.include_router(session_registration_router := session_reg_router)


@app.get("/")
def read_root():
    return {"message": f"Welcome to {settings.APP_NAME} (Hexagonal Architecture)"}
