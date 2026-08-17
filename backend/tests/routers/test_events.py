from datetime import UTC, datetime
from uuid import UUID

import time_machine
from fastapi.testclient import TestClient

PAYLOAD = {
    "title": "Barista convention",
    "description": "Make the best mochas.",
    "starts_at": "2026-10-01T19:00:00Z",
    "max_capacity": 25,
}


def test_create_event_returns_201_with_the_created_event(client: TestClient) -> None:
    response = client.post("/api/events", json=PAYLOAD)

    assert response.status_code == 201
    body = response.json()
    assert UUID(body["id"])
    assert body["title"] == "Barista convention"
    assert body["description"] == "Make the best mochas."
    assert body["max_capacity"] == 25
    assert datetime.fromisoformat(body["starts_at"]) == datetime(2026, 10, 1, 19, 0, tzinfo=UTC)


@time_machine.travel("2026-12-01T00:00:00Z")
def test_create_event_in_the_past_returns_409(client: TestClient) -> None:
    response = client.post("/api/events", json=PAYLOAD)

    assert response.status_code == 409
    assert response.json() == {
        "detail": "cannot create an event starting at 2026-10-01T19:00:00+00:00",
        "code": "event_in_past",
    }


def test_a_malformed_body_still_returns_422(client: TestClient) -> None:
    response = client.post("/api/events", json={**PAYLOAD, "max_capacity": 0})

    assert response.status_code == 422
