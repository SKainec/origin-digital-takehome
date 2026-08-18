from dataclasses import replace
from datetime import UTC, datetime
from uuid import uuid4

import pytest

from app.exceptions import (
    AlreadyRegisteredError,
    EventFullError,
    EventInPastError,
    EventNotFoundError,
    RegistrationNotFoundError,
)
from app.repositories.event_repository import EventRepository
from app.repositories.registration_repository import RegistrationRepository
from app.services.event_service import EventService
from app.services.registration_service import RegistrationService
from tests.factories import store_event


@pytest.fixture
def events() -> EventRepository:
    return EventRepository()


@pytest.fixture
def registrations() -> RegistrationRepository:
    return RegistrationRepository()


@pytest.fixture
def service(events: EventRepository, registrations: RegistrationRepository) -> RegistrationService:
    return RegistrationService(EventService(events), registrations)


def test_register_records_the_registration(
    events: EventRepository,
    registrations: RegistrationRepository,
    service: RegistrationService,
) -> None:
    event = store_event(events)

    service.register(event.id, email="sarah@example.com")

    assert registrations.is_registered(event.id, "sarah@example.com") is True


def test_register_raises_for_an_unknown_event(service: RegistrationService) -> None:
    with pytest.raises(EventNotFoundError):
        service.register(uuid4(), email="sarah@example.com")


def test_register_raises_for_an_event_that_has_already_started(
    events: EventRepository,
    registrations: RegistrationRepository,
    service: RegistrationService,
) -> None:
    started = store_event(events, starts_at=datetime(2026, 8, 1, 19, 0, tzinfo=UTC))

    with pytest.raises(EventInPastError):
        service.register(started.id, email="sarah@example.com")

    assert registrations.is_registered(started.id, "sarah@example.com") is False


def test_register_raises_when_the_email_is_already_registered(
    events: EventRepository, service: RegistrationService
) -> None:
    event = store_event(events)
    service.register(event.id, email="sarah@example.com")

    with pytest.raises(AlreadyRegisteredError):
        service.register(event.id, email="sarah@example.com")


def test_list_registrations_returns_the_registered_emails(
    events: EventRepository, service: RegistrationService
) -> None:
    event = store_event(events)
    service.register(event.id, email="sarah@example.com")
    service.register(event.id, email="alex@example.com")

    assert service.list_registrations(event.id) == ["alex@example.com", "sarah@example.com"]


def test_list_registrations_is_empty_for_an_event_nobody_has_registered_for(
    events: EventRepository, service: RegistrationService
) -> None:
    """An empty roster is a valid answer, not an error."""
    event = store_event(events)

    assert service.list_registrations(event.id) == []


def test_list_registrations_raises_for_an_unknown_event(service: RegistrationService) -> None:
    """A typo'd id is a 404, not an empty roster indistinguishable from a real one."""
    with pytest.raises(EventNotFoundError):
        service.list_registrations(uuid4())


def test_cancel_removes_the_registration(
    events: EventRepository,
    registrations: RegistrationRepository,
    service: RegistrationService,
) -> None:
    event = store_event(events)
    service.register(event.id, email="sarah@example.com")

    service.cancel(event.id, email="sarah@example.com")

    assert registrations.is_registered(event.id, "sarah@example.com") is False


def test_cancel_raises_for_an_unknown_event(service: RegistrationService) -> None:
    """A bad event id must not be reported as a missing registration."""
    with pytest.raises(EventNotFoundError):
        service.cancel(uuid4(), email="sarah@example.com")


def test_cancel_raises_when_the_email_is_not_registered(
    events: EventRepository, service: RegistrationService
) -> None:
    event = store_event(events)

    with pytest.raises(RegistrationNotFoundError):
        service.cancel(event.id, email="nobody@example.com")


def test_cancel_works_for_an_event_that_has_already_started(
    events: EventRepository,
    registrations: RegistrationRepository,
    service: RegistrationService,
) -> None:
    """The date rule restricts registering, not cancelling."""
    event = store_event(events)
    service.register(event.id, email="sarah@example.com")
    started = replace(event, starts_at=datetime(2026, 8, 1, 19, 0, tzinfo=UTC))
    events.update(started)

    service.cancel(started.id, email="sarah@example.com")

    assert registrations.is_registered(started.id, "sarah@example.com") is False


def test_cancelling_frees_a_seat(events: EventRepository, service: RegistrationService) -> None:
    event = store_event(events, max_capacity=1)
    service.register(event.id, email="sarah@example.com")

    service.cancel(event.id, email="sarah@example.com")
    service.register(event.id, email="alex@example.com")

    assert service.list_registrations(event.id) == ["alex@example.com"]


def test_register_raises_once_the_event_is_full(
    events: EventRepository,
    registrations: RegistrationRepository,
    service: RegistrationService,
) -> None:
    event = store_event(events, max_capacity=1)
    service.register(event.id, email="sarah@example.com")

    with pytest.raises(EventFullError):
        service.register(event.id, email="alex@example.com")

    assert registrations.is_registered(event.id, "alex@example.com") is False


def test_registering_twice_for_a_full_event_reports_the_duplicate_not_the_capacity(
    events: EventRepository, service: RegistrationService
) -> None:
    """Someone already holding a seat must not be told the event is full."""
    event = store_event(events, max_capacity=1)
    service.register(event.id, email="sarah@example.com")

    with pytest.raises(AlreadyRegisteredError):
        service.register(event.id, email="sarah@example.com")
