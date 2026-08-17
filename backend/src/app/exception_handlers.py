from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse

from app.exceptions import EventNotFoundError


def register_exception_handlers(app: FastAPI) -> None:
    """Map domain exceptions to responses, so routes never translate errors themselves."""

    @app.exception_handler(EventNotFoundError)
    async def handle_event_not_found(_: Request, exc: Exception) -> JSONResponse:
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content={"detail": str(exc), "code": "event_not_found"},
        )
