from datetime import UTC, datetime

from app.exceptions import EventInPastError
from app.models.event import Event
from app.repositories.event_repository import EventRepository


class EventService:
    def __init__(self, repo: EventRepository) -> None:
        self._repo = repo

    def create_event(
        self,
        *,
        title: str,
        description: str,
        starts_at: datetime,
        max_capacity: int,
    ) -> Event:
        if starts_at <= datetime.now(UTC):
            raise EventInPastError(f"cannot create an event starting at {starts_at.isoformat()}")

        return self._repo.create(
            title=title,
            description=description,
            starts_at=starts_at,
            max_capacity=max_capacity,
        )
