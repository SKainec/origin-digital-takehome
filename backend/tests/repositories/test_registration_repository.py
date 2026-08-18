from uuid import uuid4

import pytest

from app.repositories.registration_repository import RegistrationRepository


@pytest.fixture
def repo() -> RegistrationRepository:
    return RegistrationRepository()


def test_is_registered_is_false_for_an_email_that_has_not_registered(
    repo: RegistrationRepository,
) -> None:
    assert repo.is_registered(uuid4(), "sarah@example.com") is False


def test_add_registers_the_email_for_the_event(repo: RegistrationRepository) -> None:
    event_id = uuid4()

    repo.add(event_id=event_id, email="sarah@example.com")

    assert repo.is_registered(event_id, "sarah@example.com") is True


def test_list_for_event_returns_nothing_when_no_one_has_registered(
    repo: RegistrationRepository,
) -> None:
    assert repo.list_for_event(uuid4()) == []


def test_list_for_event_returns_that_events_emails_alphabetically(
    repo: RegistrationRepository,
) -> None:
    event_id = uuid4()
    for email in ("sarah@example.com", "alex@example.com", "morgan@example.com"):
        repo.add(event_id=event_id, email=email)
    repo.add(event_id=uuid4(), email="elsewhere@example.com")

    assert repo.list_for_event(event_id) == [
        "alex@example.com",
        "morgan@example.com",
        "sarah@example.com",
    ]


def test_count_for_event_is_zero_when_no_one_has_registered(repo: RegistrationRepository) -> None:
    assert repo.count_for_event(uuid4()) == 0


def test_count_for_event_counts_only_that_events_registrations(
    repo: RegistrationRepository,
) -> None:
    event_id = uuid4()
    repo.add(event_id=event_id, email="sarah@example.com")
    repo.add(event_id=event_id, email="alex@example.com")
    repo.add(event_id=uuid4(), email="elsewhere@example.com")

    assert repo.count_for_event(event_id) == 2


def test_delete_unregisters_the_email(repo: RegistrationRepository) -> None:
    event_id = uuid4()
    repo.add(event_id=event_id, email="sarah@example.com")

    repo.delete(event_id, "sarah@example.com")

    assert repo.is_registered(event_id, "sarah@example.com") is False


def test_delete_leaves_the_events_other_registrations_alone(
    repo: RegistrationRepository,
) -> None:
    event_id = uuid4()
    repo.add(event_id=event_id, email="sarah@example.com")
    repo.add(event_id=event_id, email="alex@example.com")

    repo.delete(event_id, "sarah@example.com")

    assert repo.list_for_event(event_id) == ["alex@example.com"]


def test_delete_raises_for_an_email_that_is_not_registered(repo: RegistrationRepository) -> None:
    with pytest.raises(KeyError):
        repo.delete(uuid4(), "nobody@example.com")
