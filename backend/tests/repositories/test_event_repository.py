from dataclasses import replace
from datetime import UTC, datetime
from uuid import uuid4

import pytest

from app.models.event import Event
from app.repositories.event_repository import EventRepository
from tests.factories import STARTS_AT, store_event


@pytest.fixture
def repo() -> EventRepository:
    return EventRepository()


def test_create_returns_an_event_carrying_the_supplied_values(repo: EventRepository) -> None:
    event = repo.create(
        title="Barista convention",
        description="Make the best mochas.",
        starts_at=STARTS_AT,
        max_capacity=25,
    )

    assert event.title == "Barista convention"
    assert event.description == "Make the best mochas."
    assert event.starts_at == STARTS_AT
    assert event.max_capacity == 25


def test_create_assigns_a_distinct_id_to_each_event(repo: EventRepository) -> None:
    first = store_event(repo, title="Boring Event", description="It's boring...")
    second = store_event(repo, title="Awesome Event", description="A cool event")

    assert first.id != second.id


def test_list_all_returns_nothing_when_no_events_are_stored(repo: EventRepository) -> None:
    assert repo.list_all() == []


def test_list_all_returns_events_soonest_first(repo: EventRepository) -> None:
    for month in (11, 9, 10):
        store_event(repo, starts_at=datetime(2026, month, 1, 19, 0, tzinfo=UTC))

    assert [event.starts_at.month for event in repo.list_all()] == [9, 10, 11]


def test_get_returns_the_stored_event(repo: EventRepository) -> None:
    created = store_event(repo)

    assert repo.get(created.id) == created


def test_get_returns_none_for_an_unknown_id(repo: EventRepository) -> None:
    assert repo.get(uuid4()) is None


def test_update_replaces_the_stored_event(repo: EventRepository) -> None:
    created = store_event(repo, title="Barista convention")

    updated = repo.update(replace(created, title="Latte art championship"))

    assert updated.id == created.id
    assert updated.title == "Latte art championship"
    assert repo.get(created.id) == updated
    assert repo.list_all() == [updated]


def test_update_raises_for_an_unknown_id_rather_than_inserting(repo: EventRepository) -> None:
    stranger = Event(
        id=uuid4(),
        title="Never stored",
        description="Not in the repository.",
        starts_at=STARTS_AT,
        max_capacity=25,
    )

    with pytest.raises(KeyError):
        repo.update(stranger)

    assert repo.list_all() == []
