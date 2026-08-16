from typing import Annotated

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import Settings, get_settings
from app.schemas import HealthResponse


def create_app() -> FastAPI:
    """Build the application.

    Exposed as a factory so tests can build an app against overridden settings.
    """
    startup_settings = get_settings()
    app = FastAPI(title=startup_settings.app_name)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=startup_settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.get("/api/health")
    async def health(
        settings: Annotated[Settings, Depends(get_settings)],
    ) -> HealthResponse:
        return HealthResponse(status="ok", app_name=settings.app_name)

    return app


app = create_app()
