from fastapi.testclient import TestClient
from sqlalchemy import func, select

from src.api.main import create_app
from src.core.config import Settings
from src.infrastructure.database.models import AssignmentDraftRecord


def make_client() -> TestClient:
    settings = Settings(
        _env_file=None,
        app_debug=True,
        database_url="sqlite+pysqlite:///:memory:",
        database_auto_create=True,
    )
    return TestClient(create_app(settings))


def test_health_check() -> None:
    with make_client() as client:
        response = client.get("/api/v1/health")

    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_readiness_check_includes_database() -> None:
    with make_client() as client:
        response = client.get("/api/v1/ready")

    assert response.status_code == 200
    assert response.json() == {"status": "ok", "database": "connected"}


def test_assignment_draft_happy_path() -> None:
    with make_client() as client:
        response = client.post(
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
        with client.app.state.db_session_factory() as session:
            record_count = session.scalar(
                select(func.count()).select_from(AssignmentDraftRecord)
            )

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ready"
    assert len(body["assignments"]) == 2
    assert record_count == 1


def test_assignment_draft_clarifies_missing_skills() -> None:
    with make_client() as client:
        response = client.post(
            "/api/v1/assignments/draft",
            json={
                "group_name": "Sloppers",
                "members": [{"name": "An", "skills": []}],
                "tasks": [{"title": "Build API", "deliverable": "working endpoint"}],
            },
        )

    assert response.status_code == 200
    assert response.json()["status"] == "clarify"


def test_chat_endpoint_my_tasks() -> None:
    with make_client() as client:
        response = client.post(
            "/api/v1/chat",
            json={
                "message": "Tôi cần làm gì?",
                "user_id": "Trọng",
                "group_id": "Sloppers",
            },
        )

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ready"
    assert "Canvas 7 dòng" in data["answer"]


def test_chat_endpoint_progress() -> None:
    with make_client() as client:
        response = client.post(
            "/api/v1/chat",
            json={
                "message": "Tiến độ nhóm còn bao nhiêu việc?",
                "user_id": "Trọng",
                "group_id": "Sloppers",
            },
        )

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ready"
    assert "Nhóm đã xong" in data["answer"]


def test_chat_endpoint_deliverables() -> None:
    with make_client() as client:
        response = client.post(
            "/api/v1/chat",
            json={
                "message": "Cần nộp những gì cho bài Hackathon?",
                "user_id": "Trang",
                "group_id": "Sloppers",
            },
        )

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ready"
    assert "CP1: Canvas 7 dòng" in data["answer"]
