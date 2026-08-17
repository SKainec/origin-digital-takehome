class EventInPastError(Exception):
    """Raised when an event would start at or before the current moment."""


class EventNotFoundError(Exception):
    """Raised when no event exists for a requested id."""
