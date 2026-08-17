from datetime import UTC, datetime

import pytest
import time_machine

from app.exceptions import EventInPastError
from app.repositories.event_repository import EventRepository
from app.services.event_service import EventService

NOW = "2026-09-01T19:00:00Z"
EARLIER = datetime(2026, 8, 1, 19, 0, tzinfo=UTC)
LATER = datetime(2026, 10, 1, 19, 0, tzinfo=UTC)


def test_create_event_returns_the_stored_event() -> None:
    service = EventService(EventRepository())

    event = service.create_event(
        title="Barista convention",
        description="Make the best mochas.",
        starts_at=LATER,
        max_capacity=25,
    )

    assert event.id is not None
    assert event.title == "Barista convention"
    assert event.description == "Make the best mochas."
    assert event.starts_at == LATER
    assert event.max_capacity == 25


@time_machine.travel(NOW)
def test_create_event_rejects_a_start_in_the_past() -> None:
    service = EventService(EventRepository())

    with pytest.raises(EventInPastError):
        service.create_event(
            title="Barista convention",
            description="Make the best mochas.",
            starts_at=EARLIER,
            max_capacity=25,
        )


@time_machine.travel(NOW, tick=False)
def test_create_event_rejects_a_start_of_exactly_now() -> None:
    service = EventService(EventRepository())

    with pytest.raises(EventInPastError):
        service.create_event(
            title="Barista convention",
            description="Make the best mochas.",
            starts_at=datetime.now(UTC),
            max_capacity=25,
        )
