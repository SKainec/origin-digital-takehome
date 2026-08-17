from fastapi import APIRouter, status

from app.dependencies import EventServiceDep
from app.schemas.event import EventCreate, EventResponse

router = APIRouter(prefix="/api/events", tags=["events"])


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_event(payload: EventCreate, service: EventServiceDep) -> EventResponse:
    event = service.create_event(
        title=payload.title,
        description=payload.description,
        starts_at=payload.starts_at,
        max_capacity=payload.max_capacity,
    )
    return EventResponse.model_validate(event)
