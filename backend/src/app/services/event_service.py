from dataclasses import replace
from datetime import datetime
from uuid import UUID

from app.exceptions import EventNotFoundError
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
        return self._repo.create(
            title=title,
            description=description,
            starts_at=starts_at,
            max_capacity=max_capacity,
        )

    def list_events(self) -> list[Event]:
        return self._repo.list_all()

    def event_exists(self, event_id: UUID) -> bool:
        return self._repo.get(event_id) is not None

    def get_event(self, event_id: UUID) -> Event:
        event = self._repo.get(event_id)
        if event is None:
            raise EventNotFoundError(f"no event with id {event_id}")
        return event

    def update_event(
        self,
        event_id: UUID,
        *,
        title: str,
        description: str,
        starts_at: datetime,
        max_capacity: int,
    ) -> Event:
        # Lowering max_capacity below the current registration count is allowed and leaves
        # the event over-subscribed; nobody is dropped. Further registrations are rejected,
        # since register() refuses while count >= max_capacity.
        existing = self.get_event(event_id)

        return self._repo.update(
            replace(
                existing,
                title=title,
                description=description,
                starts_at=starts_at,
                max_capacity=max_capacity,
            )
        )
