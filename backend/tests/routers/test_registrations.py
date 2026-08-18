from uuid import uuid4

import pytest
from fastapi.testclient import TestClient

EVENT = {
    "title": "Barista convention",
    "description": "Make the best mochas.",
    "starts_at": "2026-10-01T19:00:00Z",
    "max_capacity": 25,
}


def test_register_returns_201_with_the_registered_email(client: TestClient) -> None:
    event = client.post("/api/events", json=EVENT).json()

    response = client.post(
        f"/api/events/{event['id']}/registrations",
        json={"email": "sarah@example.com"},
    )

    assert response.status_code == 201
    assert response.json() == {"email": "sarah@example.com"}


def test_list_registrations_returns_200_with_the_emails_alphabetically(
    client: TestClient,
) -> None:
    event = client.post("/api/events", json=EVENT).json()
    for email in ("sarah@example.com", "alex@example.com"):
        client.post(f"/api/events/{event['id']}/registrations", json={"email": email})

    response = client.get(f"/api/events/{event['id']}/registrations")

    assert response.status_code == 200
    assert response.json() == ["alex@example.com", "sarah@example.com"]


def test_list_registrations_returns_200_with_an_empty_list_when_nobody_has_registered(
    client: TestClient,
) -> None:
    event = client.post("/api/events", json=EVENT).json()

    response = client.get(f"/api/events/{event['id']}/registrations")

    assert response.status_code == 200
    assert response.json() == []


def test_unregister_returns_204_and_removes_the_registration(client: TestClient) -> None:
    event = client.post("/api/events", json=EVENT).json()
    client.post(f"/api/events/{event['id']}/registrations", json={"email": "sarah@example.com"})

    response = client.delete(f"/api/events/{event['id']}/registrations/sarah@example.com")

    assert response.status_code == 204
    assert client.get(f"/api/events/{event['id']}/registrations").json() == []


def test_unregister_returns_404_when_the_email_is_not_registered(client: TestClient) -> None:
    event = client.post("/api/events", json=EVENT).json()

    response = client.delete(f"/api/events/{event['id']}/registrations/nobody@example.com")

    assert response.status_code == 404
    assert response.json() == {
        "detail": f"nobody@example.com is not registered for event {event['id']}",
        "code": "registration_not_found",
    }


def test_register_returns_409_when_already_registered(client: TestClient) -> None:
    event = client.post("/api/events", json=EVENT).json()
    body = {"email": "sarah@example.com"}
    client.post(f"/api/events/{event['id']}/registrations", json=body)

    response = client.post(f"/api/events/{event['id']}/registrations", json=body)

    assert response.status_code == 409
    assert response.json() == {
        "detail": f"sarah@example.com is already registered for event {event['id']}",
        "code": "already_registered",
    }


def test_register_returns_409_when_the_event_is_full(client: TestClient) -> None:
    event = client.post("/api/events", json={**EVENT, "max_capacity": 1}).json()
    client.post(f"/api/events/{event['id']}/registrations", json={"email": "sarah@example.com"})

    response = client.post(
        f"/api/events/{event['id']}/registrations",
        json={"email": "alex@example.com"},
    )

    assert response.status_code == 409
    assert response.json() == {
        "detail": f"event {event['id']} is at its capacity of 1",
        "code": "event_full",
    }


def test_register_returns_409_for_an_event_that_has_already_started(client: TestClient) -> None:
    event = client.post("/api/events", json={**EVENT, "starts_at": "2026-08-01T19:00:00Z"}).json()

    response = client.post(
        f"/api/events/{event['id']}/registrations",
        json={"email": "sarah@example.com"},
    )

    assert response.status_code == 409
    assert response.json() == {
        "detail": f"event {event['id']} started at 2026-08-01T19:00:00+00:00",
        "code": "event_in_past",
    }


@pytest.mark.parametrize(
    "body",
    [
        pytest.param({"email": "not-an-email"}, id="malformed email"),
        pytest.param({"email": "sarah@example.com", "name": "Sarah"}, id="unknown field"),
        pytest.param({}, id="missing email"),
    ],
)
def test_a_malformed_registration_body_returns_422(
    client: TestClient, body: dict[str, object]
) -> None:
    event = client.post("/api/events", json=EVENT).json()

    response = client.post(f"/api/events/{event['id']}/registrations", json=body)

    assert response.status_code == 422


def test_an_email_differing_only_in_case_is_the_same_registrant(client: TestClient) -> None:
    event = client.post("/api/events", json=EVENT).json()

    created = client.post(
        f"/api/events/{event['id']}/registrations",
        json={"email": "Sarah@Example.COM"},
    )
    repeat = client.post(
        f"/api/events/{event['id']}/registrations",
        json={"email": "sarah@example.com"},
    )

    assert created.json() == {"email": "sarah@example.com"}
    assert repeat.status_code == 409
    assert client.get(f"/api/events/{event['id']}/registrations").json() == ["sarah@example.com"]


def test_unregistering_matches_a_registration_made_in_another_case(client: TestClient) -> None:
    event = client.post("/api/events", json=EVENT).json()
    client.post(f"/api/events/{event['id']}/registrations", json={"email": "sarah@example.com"})

    response = client.delete(f"/api/events/{event['id']}/registrations/Sarah@Example.COM")

    assert response.status_code == 204


def test_list_registrations_returns_404_for_an_unknown_event(client: TestClient) -> None:
    unknown = uuid4()

    response = client.get(f"/api/events/{unknown}/registrations")

    assert response.status_code == 404
    assert response.json() == {
        "detail": f"no event with id {unknown}",
        "code": "event_not_found",
    }
