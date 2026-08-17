from collections.abc import Iterator

import pytest
from fastapi.testclient import TestClient

from app.dependencies import get_event_repository
from app.main import create_app


@pytest.fixture(autouse=True)
def _clear_event_repository() -> Iterator[None]:
    """The store is a cached singleton, so events would otherwise leak between tests."""
    get_event_repository.cache_clear()
    yield
    get_event_repository.cache_clear()


@pytest.fixture
def client() -> Iterator[TestClient]:
    with TestClient(create_app()) as test_client:
        yield test_client
