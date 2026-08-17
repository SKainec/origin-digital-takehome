from collections.abc import Iterator

import pytest
import time_machine
from fastapi.testclient import TestClient

from app.dependencies import get_event_repository
from app.main import create_app

NOW = "2026-09-01T19:00:00Z"


@pytest.fixture(autouse=True)
def _freeze_clock() -> Iterator[None]:
    """Otherwise a test's hardcoded future date silently rots into the past."""
    with time_machine.travel(NOW, tick=False):
        yield


@pytest.fixture(autouse=True)
def _clear_event_repository() -> Iterator[None]:
    """The store is a cached singleton, so events would otherwise leak between tests."""
    get_event_repository.cache_clear()
    yield
    get_event_repository.cache_clear()


@pytest.fixture
def client(_clear_event_repository: None) -> Iterator[TestClient]:
    with TestClient(create_app()) as test_client:
        yield test_client
