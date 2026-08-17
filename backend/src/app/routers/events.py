from uuid import UUID

from fastapi import APIRouter, status

from app.dependencies import EventServiceDep
from app.models.event import Event
from app.schemas.event import EventCreate, EventResponse

router = APIRouter(prefix="/api/events", tags=["events"])


@router.post("", status_code=status.HTTP_201_CREATED, response_model=EventResponse)
async def create_event(payload: EventCreate, service: EventServiceDep) -> Event:
    return service.create_event(
        title=payload.title,
        description=payload.description,
        starts_at=payload.starts_at,
        max_capacity=payload.max_capacity,
    )


@router.get("", response_model=list[EventResponse])
async def list_events(service: EventServiceDep) -> list[Event]:
    return service.list_events()


@router.get("/{event_id}", response_model=EventResponse)
async def get_event(event_id: UUID, service: EventServiceDep) -> Event:
    return service.get_event(event_id)
