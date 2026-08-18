from functools import lru_cache
from typing import Annotated

from fastapi import Depends

from app.repositories.event_repository import EventRepository
from app.repositories.registration_repository import RegistrationRepository
from app.services.event_service import EventService
from app.services.registration_service import RegistrationService


@lru_cache
def get_event_repository() -> EventRepository:
    """The in-memory store, cached so every request shares one instance."""
    return EventRepository()


@lru_cache
def get_registration_repository() -> RegistrationRepository:
    return RegistrationRepository()


def get_event_service(
    repo: Annotated[EventRepository, Depends(get_event_repository)],
) -> EventService:
    return EventService(repo)


EventServiceDep = Annotated[EventService, Depends(get_event_service)]


def get_registration_service(
    events: EventServiceDep,
    registrations: Annotated[RegistrationRepository, Depends(get_registration_repository)],
) -> RegistrationService:
    return RegistrationService(events, registrations)


RegistrationServiceDep = Annotated[RegistrationService, Depends(get_registration_service)]
