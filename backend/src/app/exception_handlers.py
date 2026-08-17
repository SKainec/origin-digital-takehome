from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse

from app.exceptions import EventInPastError, EventNotFoundError


def register_exception_handlers(app: FastAPI) -> None:
    """Map domain exceptions to responses, so routes never translate errors themselves."""

    @app.exception_handler(EventInPastError)
    async def handle_event_in_past(_: Request, exc: Exception) -> JSONResponse:
        return JSONResponse(
            status_code=status.HTTP_409_CONFLICT,
            content={"detail": str(exc), "code": "event_in_past"},
        )

    @app.exception_handler(EventNotFoundError)
    async def handle_event_not_found(_: Request, exc: Exception) -> JSONResponse:
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content={"detail": str(exc), "code": "event_not_found"},
        )
