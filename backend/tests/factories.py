from datetime import UTC, datetime

from app.models.event import Event
from app.repositories.event_repository import EventRepository

STARTS_AT = datetime(2026, 9, 1, 19, 0, tzinfo=UTC)


def store_event(
    repo: EventRepository,
    *,
    title: str = "Barista convention",
    description: str = "Make the best mochas.",
    starts_at: datetime = STARTS_AT,
    max_capacity: int = 25,
) -> Event:
    """Store an event, so a test names only the fields it actually asserts on."""
    return repo.create(
        title=title,
        description=description,
        starts_at=starts_at,
        max_capacity=max_capacity,
    )
