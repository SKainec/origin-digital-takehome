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

    def get(self, event_id: UUID) -> Event | None:
        raise NotImplementedError

    def update(self, event: Event) -> Event:
        raise NotImplementedError
