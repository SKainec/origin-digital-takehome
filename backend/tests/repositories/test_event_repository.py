from datetime import UTC, datetime

from app.repositories.event_repository import EventRepository

STARTS_AT = datetime(2026, 9, 1, 19, 0, tzinfo=UTC)


def test_create_returns_an_event_carrying_the_supplied_values() -> None:
    repo = EventRepository()

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


def test_create_assigns_a_distinct_id_to_each_event() -> None:
    repo = EventRepository()

    first = repo.create(
        title="Boring Event",
        description="It's boring...",
        starts_at=STARTS_AT,
        max_capacity=25,
    )
    second = repo.create(
        title="Awesome Event",
        description="A cool event",
        starts_at=STARTS_AT,
        max_capacity=25,
    )

    assert first.id != second.id
