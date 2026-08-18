from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse

from app.exceptions import (
    AlreadyRegisteredError,
    EventFullError,
    EventInPastError,
    EventNotFoundError,
    RegistrationNotFoundError,
)


def register_exception_handlers(app: FastAPI) -> None:
    """Map domain exceptions to responses, so routes never translate errors themselves."""

    @app.exception_handler(EventNotFoundError)
    async def handle_event_not_found(_: Request, exc: Exception) -> JSONResponse:
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content={"detail": str(exc), "code": "event_not_found"},
        )

    @app.exception_handler(RegistrationNotFoundError)
    async def handle_registration_not_found(_: Request, exc: Exception) -> JSONResponse:
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content={"detail": str(exc), "code": "registration_not_found"},
        )

    @app.exception_handler(EventInPastError)
    async def handle_event_in_past(_: Request, exc: Exception) -> JSONResponse:
        return JSONResponse(
            status_code=status.HTTP_409_CONFLICT,
            content={"detail": str(exc), "code": "event_in_past"},
        )

    @app.exception_handler(AlreadyRegisteredError)
    async def handle_already_registered(_: Request, exc: Exception) -> JSONResponse:
        return JSONResponse(
            status_code=status.HTTP_409_CONFLICT,
            content={"detail": str(exc), "code": "already_registered"},
        )

    @app.exception_handler(EventFullError)
    async def handle_event_full(_: Request, exc: Exception) -> JSONResponse:
        return JSONResponse(
            status_code=status.HTTP_409_CONFLICT,
            content={"detail": str(exc), "code": "event_full"},
        )
