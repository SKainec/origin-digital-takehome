from uuid import UUID

from fastapi import APIRouter, status

from app.dependencies import RegistrationServiceDep
from app.schemas.registration import Email, RegistrationRequest, RegistrationResponse

router = APIRouter(prefix="/api/events/{event_id}/registrations", tags=["registrations"])


@router.post("", status_code=status.HTTP_201_CREATED, response_model=RegistrationResponse)
async def register(
    event_id: UUID, payload: RegistrationRequest, service: RegistrationServiceDep
) -> RegistrationResponse:
    service.register(event_id, email=payload.email)

    # Echoes the normalized address, which is the one thing the caller cannot predict.
    return RegistrationResponse(email=payload.email)


@router.get("")
async def list_registrations(event_id: UUID, service: RegistrationServiceDep) -> list[str]:
    return service.list_registrations(event_id)


@router.delete("/{email}", status_code=status.HTTP_204_NO_CONTENT)
async def unregister(event_id: UUID, email: Email, service: RegistrationServiceDep) -> None:
    service.cancel(event_id, email=email)
