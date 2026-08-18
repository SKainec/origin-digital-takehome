from collections.abc import Iterator

import pytest
import time_machine
from fastapi.testclient import TestClient

from app.dependencies import get_event_repository, get_registration_repository
from app.main import create_app

NOW = "2026-09-01T19:00:00Z"


@pytest.fixture(autouse=True)
def _freeze_clock() -> Iterator[None]:
    """Pin "now" so a test's hardcoded date cannot rot as the calendar moves past it."""
    with time_machine.travel(NOW, tick=False):
        yield


@pytest.fixture(autouse=True)
def _clear_repositories() -> Iterator[None]:
    """The stores are cached singletons, so data would otherwise leak between tests."""
    get_event_repository.cache_clear()
    get_registration_repository.cache_clear()
    yield
    get_event_repository.cache_clear()
    get_registration_repository.cache_clear()


@pytest.fixture
def client(_clear_repositories: None) -> Iterator[TestClient]:
    with TestClient(create_app()) as test_client:
        yield test_client
