from uuid import UUID


class RegistrationRepository:
    """A registration is an email in an event's set — there is no registration record.

    Sets because every rule this store backs is a membership or size question, both O(1):
    capacity is checked on each attempt, and so is whether the email is already in.
    """

    def __init__(self) -> None:
        self._by_event: dict[UUID, set[str]] = {}

    def add(self, *, event_id: UUID, email: str) -> None:
        self._by_event.setdefault(event_id, set()).add(email)

    def is_registered(self, event_id: UUID, email: str) -> bool:
        return email in self._by_event.get(event_id, set())

    def list_for_event(self, event_id: UUID) -> list[str]:
        """Sorted only here, where the whole set is being read anyway."""
        return sorted(self._by_event.get(event_id, set()))

    def count_for_event(self, event_id: UUID) -> int:
        return len(self._by_event.get(event_id, set()))

    def delete(self, event_id: UUID, email: str) -> None:
        """Raises KeyError when there is nothing to delete, as EventRepository.update does."""
        self._by_event.get(event_id, set()).remove(email)
