from datetime import UTC, datetime
from uuid import uuid4

import pytest
import time_machine

from app.exceptions import EventInPastError, EventNotFoundError
from app.models.event import Event
from app.repositories.event_repository import EventRepository
from app.services.event_service import EventService
from tests.factories import store_event

NOW = "2026-09-01T19:00:00Z"
EARLIER = datetime(2026, 8, 1, 19, 0, tzinfo=UTC)
LATER = datetime(2026, 10, 1, 19, 0, tzinfo=UTC)


@pytest.fixture
def repo() -> EventRepository:
    return EventRepository()


@pytest.fixture
def service(repo: EventRepository) -> EventService:
    return EventService(repo)


def create_event(service: EventService, starts_at: datetime) -> Event:
    return service.create_event(
        title="Barista convention",
        description="Make the best mochas.",
        starts_at=starts_at,
        max_capacity=25,
    )


def test_create_event_returns_the_stored_event(
    repo: EventRepository, service: EventService
) -> None:
    event = service.create_event(
        title="Barista convention",
        description="Make the best mochas.",
        starts_at=LATER,
        max_capacity=25,
    )

    assert repo.get(event.id) == event
    assert event.title == "Barista convention"
    assert event.description == "Make the best mochas."
    assert event.starts_at == LATER
    assert event.max_capacity == 25


@time_machine.travel(NOW)
def test_create_event_rejects_a_start_in_the_past(service: EventService) -> None:
    with pytest.raises(EventInPastError):
        create_event(service, starts_at=EARLIER)


@time_machine.travel(NOW, tick=False)
def test_create_event_rejects_a_start_of_exactly_now(service: EventService) -> None:
    with pytest.raises(EventInPastError):
        create_event(service, starts_at=datetime.now(UTC))


def test_list_events_returns_what_the_repository_holds(
    repo: EventRepository, service: EventService
) -> None:
    created = store_event(repo)

    assert service.list_events() == [created]


def test_get_event_returns_the_stored_event(repo: EventRepository, service: EventService) -> None:
    created = store_event(repo)

    assert service.get_event(created.id) == created


def test_get_event_raises_for_an_unknown_id(service: EventService) -> None:
    with pytest.raises(EventNotFoundError):
        service.get_event(uuid4())
