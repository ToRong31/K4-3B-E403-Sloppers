from fastapi.testclient import TestClient

from src.api.main import create_app
from src.core.config import Settings


def make_client() -> TestClient:
    return TestClient(create_app(Settings(app_debug=True)))


def test_health_check() -> None:
    response = make_client().get("/api/v1/health")

    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_assignment_draft_happy_path() -> None:
    response = make_client().post(
        "/api/v1/assignments/draft",
        json={
            "group_name": "Sloppers",
            "members": [
                {"name": "Trang", "skills": ["Research"]},
                {"name": "Dương", "skills": ["AI", "Evaluation"]},
            ],
            "tasks": [
                {"title": "AI evaluation", "deliverable": "golden set"},
                {"title": "Research evidence", "deliverable": "survey log"},
            ],
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ready"
    assert len(body["assignments"]) == 2


def test_assignment_draft_clarifies_missing_skills() -> None:
    response = make_client().post(
        "/api/v1/assignments/draft",
        json={
            "group_name": "Sloppers",
            "members": [{"name": "An", "skills": []}],
            "tasks": [{"title": "Build API", "deliverable": "working endpoint"}],
        },
    )

    assert response.status_code == 200
    assert response.json()["status"] == "clarify"
