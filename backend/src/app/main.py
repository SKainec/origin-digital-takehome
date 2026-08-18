from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.exception_handlers import register_exception_handlers
from app.routers import events, registrations


def create_app() -> FastAPI:
    """Build the application.

    Exposed as a factory so each test gets a fresh app instead of sharing module state.
    """
    settings = get_settings()
    app = FastAPI(title=settings.app_name)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(events.router)
    app.include_router(registrations.router)
    register_exception_handlers(app)

    return app


app = create_app()
