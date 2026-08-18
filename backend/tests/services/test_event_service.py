from datetime import UTC, datetime
from uuid import uuid4

import pytest

from app.exceptions import EventNotFoundError
from app.repositories.event_repository import EventRepository
from app.services.event_service import EventService
from tests.factories import store_event

LATER = datetime(2026, 10, 1, 19, 0, tzinfo=UTC)


@pytest.fixture
def repo() -> EventRepository:
    return EventRepository()


@pytest.fixture
def service(repo: EventRepository) -> EventService:
    return EventService(repo)


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


def test_list_events_returns_what_the_repository_holds(
    repo: EventRepository, service: EventService
) -> None:
    created = store_event(repo)

    assert service.list_events() == [created]


def test_get_event_returns_the_stored_event(repo: EventRepository, service: EventService) -> None:
    created = store_event(repo)

    assert service.get_event(created.id) == created


def test_event_exists_is_true_for_a_stored_event(
    repo: EventRepository, service: EventService
) -> None:
    created = store_event(repo)

    assert service.event_exists(created.id) is True


def test_event_exists_is_false_for_an_unknown_id(service: EventService) -> None:
    assert service.event_exists(uuid4()) is False


def test_get_event_raises_for_an_unknown_id(service: EventService) -> None:
    with pytest.raises(EventNotFoundError):
        service.get_event(uuid4())


def test_update_event_returns_the_stored_event(
    repo: EventRepository, service: EventService
) -> None:
    created = store_event(repo, title="Barista convention")

    updated = service.update_event(
        created.id,
        title="Latte art championship",
        description="Pour the best rosetta.",
        starts_at=LATER,
        max_capacity=50,
    )

    assert updated.id == created.id
    assert updated.title == "Latte art championship"
    assert updated.description == "Pour the best rosetta."
    assert updated.starts_at == LATER
    assert updated.max_capacity == 50
    assert repo.get(created.id) == updated


def test_update_event_raises_for_an_unknown_id(service: EventService) -> None:
    with pytest.raises(EventNotFoundError):
        service.update_event(
            uuid4(),
            title="Latte art championship",
            description="Pour the best rosetta.",
            starts_at=LATER,
            max_capacity=50,
        )
