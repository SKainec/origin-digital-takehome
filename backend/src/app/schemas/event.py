from datetime import datetime
from uuid import UUID

from pydantic import AwareDatetime, BaseModel, ConfigDict, Field


class EventCreate(BaseModel):
    title: str = Field(min_length=1)
    description: str
    starts_at: AwareDatetime
    max_capacity: int = Field(ge=1)


class EventResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    title: str
    description: str
    starts_at: datetime
    max_capacity: int
