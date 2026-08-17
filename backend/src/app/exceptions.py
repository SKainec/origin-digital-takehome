class EventInPastError(Exception):
    """Raised when an event would start at or before the current moment."""
