from datetime import UTC, datetime
from uuid import uuid4

import pytest

from app.models.event import Event

STARTS_AT = datetime(2026, 9, 1, 19, 0, tzinfo=UTC)


def test_a_valid_event_is_constructed_intact() -> None:
    event_id = uuid4()

    event = Event(
        id=event_id,
        title="Barista convention",
        description="Make the best mochas.",
        starts_at=STARTS_AT,
        max_capacity=25,
    )

    assert event.id == event_id
    assert event.title == "Barista convention"
    assert event.description == "Make the best mochas."
    assert event.starts_at == STARTS_AT
    assert event.max_capacity == 25


def test_title_must_not_be_blank() -> None:
    with pytest.raises(ValueError, match="title"):
        Event(
            id=uuid4(),
            title="   ",
            description="Make the best mochas.",
            starts_at=STARTS_AT,
            max_capacity=25,
        )


@pytest.mark.parametrize("capacity", [0, -1])
def test_max_capacity_must_be_at_least_one(capacity: int) -> None:
    with pytest.raises(ValueError, match="max_capacity"):
        Event(
            id=uuid4(),
            title="Barista convention",
            description="Make the best mochas.",
            starts_at=STARTS_AT,
            max_capacity=capacity,
        )


def test_starts_at_must_be_timezone_aware() -> None:
    with pytest.raises(ValueError, match="starts_at"):
        Event(
            id=uuid4(),
            title="Barista convention",
            description="Make the best mochas.",
            starts_at=datetime(2026, 9, 1, 19, 0),
            max_capacity=25,
        )
