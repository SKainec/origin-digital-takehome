from dataclasses import dataclass
from datetime import datetime
from uuid import UUID


# Frozen because the repository stores references, not copies: a mutable Event
# handed out by get() would let callers change stored state without an update()
# call. Mutations build a new instance, so every write goes through the store.
@dataclass(frozen=True, slots=True)
class Event:
    id: UUID
    title: str
    description: str
    starts_at: datetime
    max_capacity: int

    def __post_init__(self) -> None:
        if not self.title.strip():
            raise ValueError("title must not be blank")
        if self.max_capacity < 1:
            raise ValueError("max_capacity must be at least 1")
        if self.starts_at.utcoffset() is None:
            raise ValueError("starts_at must be timezone-aware")
