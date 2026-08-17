from datetime import datetime
from typing import Annotated
from uuid import UUID

from pydantic import AwareDatetime, BaseModel, ConfigDict, Field, StringConstraints


class EventRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1)]
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
