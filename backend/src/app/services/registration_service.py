from datetime import UTC, datetime
from uuid import UUID

from app.exceptions import (
    AlreadyRegisteredError,
    EventFullError,
    EventInPastError,
    EventNotFoundError,
    RegistrationNotFoundError,
)
from app.repositories.registration_repository import RegistrationRepository
from app.services.event_service import EventService


class RegistrationService:
    # Depends on EventService rather than EventRepository so an unknown event raises the
    # same EventNotFoundError the event routes already return a 404 for.
    def __init__(self, events: EventService, registrations: RegistrationRepository) -> None:
        self._events = events
        self._registrations = registrations

    def register(self, event_id: UUID, *, email: str) -> None:
        event = self._events.get_event(event_id)

        if event.starts_at <= datetime.now(UTC):
            raise EventInPastError(f"event {event_id} started at {event.starts_at.isoformat()}")

        # Order matters: someone already holding a seat must hear that, not "event full".
        if self._registrations.is_registered(event_id, email):
            raise AlreadyRegisteredError(f"{email} is already registered for event {event_id}")

        if self._registrations.count_for_event(event_id) >= event.max_capacity:
            raise EventFullError(f"event {event_id} is at its capacity of {event.max_capacity}")

        self._registrations.add(event_id=event_id, email=email)

    def cancel(self, event_id: UUID, *, email: str) -> None:
        # No past-event check here: someone registered for an event that has since
        # started still has a legitimate reason to cancel, so the date rule only
        # applies to register(), not cancel().
        if not self._events.event_exists(event_id):
            raise EventNotFoundError(f"no event with id {event_id}")

        try:
            self._registrations.delete(event_id, email)
        except KeyError:
            raise RegistrationNotFoundError(
                f"{email} is not registered for event {event_id}"
            ) from None

    def list_registrations(self, event_id: UUID) -> list[str]:
        if not self._events.event_exists(event_id):
            raise EventNotFoundError(f"no event with id {event_id}")

        return self._registrations.list_for_event(event_id)
