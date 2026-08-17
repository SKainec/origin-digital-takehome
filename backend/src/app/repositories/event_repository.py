from datetime import datetime
from uuid import UUID, uuid4

from app.models.event import Event


class EventRepository:
    def __init__(self) -> None:
        self._events: dict[UUID, Event] = {}

    def create(
        self,
        *,
        title: str,
        description: str,
        starts_at: datetime,
        max_capacity: int,
    ) -> Event:
        event = Event(
            id=uuid4(),
            title=title,
            description=description,
            starts_at=starts_at,
            max_capacity=max_capacity,
        )
        self._events[event.id] = event
        return event

    def list_all(self) -> list[Event]:
        """Soonest first — the ordering a SQL implementation would push into ORDER BY."""
        return sorted(self._events.values(), key=lambda event: event.starts_at)

    def get(self, event_id: UUID) -> Event | None:
        return self._events.get(event_id)

    def update(self, event: Event) -> Event:
        """Replace an event that already exists. Raises KeyError rather than inserting."""
        if event.id not in self._events:
            raise KeyError(event.id)
        self._events[event.id] = event
        return event
