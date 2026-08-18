class EventNotFoundError(Exception):
    """Raised when no event exists for a requested id."""


class RegistrationNotFoundError(Exception):
    """Raised when cancelling a registration that does not exist."""


class EventFullError(Exception):
    """Raised when an event has reached its max_capacity."""


class AlreadyRegisteredError(Exception):
    """Raised when an email is already registered for the event."""


class EventInPastError(Exception):
    """Raised when registering for an event that has already started.

    Scoped to registration. An earlier version enforced this at event creation, which the
    brief does not ask for and which made the rule impossible to exercise: no past event
    could be stored to attempt a registration against.
    """
