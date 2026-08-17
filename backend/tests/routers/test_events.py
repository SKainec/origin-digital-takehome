from datetime import UTC, datetime
from uuid import UUID, uuid4

import pytest
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


def test_list_events_returns_200_with_the_created_events(client: TestClient) -> None:
    created = client.post("/api/events", json=PAYLOAD).json()

    response = client.get("/api/events")

    assert response.status_code == 200
    assert response.json() == [created]


def test_list_events_returns_200_with_an_empty_list_when_nothing_is_stored(
    client: TestClient,
) -> None:
    response = client.get("/api/events")

    assert response.status_code == 200
    assert response.json() == []


def test_get_event_returns_200_with_the_event(client: TestClient) -> None:
    created = client.post("/api/events", json=PAYLOAD).json()

    response = client.get(f"/api/events/{created['id']}")

    assert response.status_code == 200
    assert response.json() == created


def test_get_event_returns_404_for_an_unknown_id(client: TestClient) -> None:
    unknown = uuid4()

    response = client.get(f"/api/events/{unknown}")

    assert response.status_code == 404
    assert response.json() == {
        "detail": f"no event with id {unknown}",
        "code": "event_not_found",
    }


def test_update_event_returns_200_with_the_updated_event(client: TestClient) -> None:
    created = client.post("/api/events", json=PAYLOAD).json()

    response = client.put(
        f"/api/events/{created['id']}",
        json={**PAYLOAD, "title": "Latte art championship", "max_capacity": 50},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["id"] == created["id"]
    assert body["title"] == "Latte art championship"
    assert body["max_capacity"] == 50


def test_update_event_returns_404_for_an_unknown_id(client: TestClient) -> None:
    unknown = uuid4()

    response = client.put(f"/api/events/{unknown}", json=PAYLOAD)

    assert response.status_code == 404
    assert response.json() == {
        "detail": f"no event with id {unknown}",
        "code": "event_not_found",
    }


def test_a_malformed_body_still_returns_422(client: TestClient) -> None:
    response = client.post("/api/events", json={**PAYLOAD, "max_capacity": 0})

    assert response.status_code == 422


def test_a_whitespace_only_title_returns_422(client: TestClient) -> None:
    response = client.post("/api/events", json={**PAYLOAD, "title": "   "})

    assert response.status_code == 422


def test_an_unknown_field_returns_422(client: TestClient) -> None:
    response = client.post("/api/events", json={**PAYLOAD, "maxCapacity": 25})

    assert response.status_code == 422


@pytest.mark.parametrize(
    "body",
    [
        pytest.param({**PAYLOAD, "max_capacity": 0}, id="max_capacity below one"),
        pytest.param({**PAYLOAD, "title": "   "}, id="whitespace-only title"),
        pytest.param({**PAYLOAD, "maxCapacity": 25}, id="unknown field"),
        pytest.param({"title": "Latte art championship"}, id="partial body"),
    ],
)
def test_a_malformed_update_body_returns_422(client: TestClient, body: dict[str, object]) -> None:
    created = client.post("/api/events", json=PAYLOAD).json()

    response = client.put(f"/api/events/{created['id']}", json=body)

    assert response.status_code == 422


def test_a_malformed_id_returns_422_rather_than_404(client: TestClient) -> None:
    response = client.get("/api/events/not-a-uuid")

    assert response.status_code == 422


def test_a_malformed_id_on_update_returns_422_rather_than_404(client: TestClient) -> None:
    response = client.put("/api/events/not-a-uuid", json=PAYLOAD)

    assert response.status_code == 422
