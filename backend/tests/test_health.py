from fastapi.testclient import TestClient


def test_health_returns_ok(client: TestClient) -> None:
    response = client.get("/api/health")

    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_health_reports_app_name(client: TestClient) -> None:
    response = client.get("/api/health")

    assert response.json()["app_name"] == "Event Management API"
