from fastapi.testclient import TestClient
from langchain_core.messages import AIMessage
from sqlalchemy import func, select

from src.api.deps import get_checklist_store, get_router_graph
from src.api.main import create_app
from src.core.config import Settings
from src.infrastructure.database.models import AssignmentDraftRecord


class FakeChatModel:
    model_name = "fake-chat-model"

    def invoke(self, messages):
        question = messages[-1].content.casefold()
        if "tôi cần làm gì" in question:
            return AIMessage(content="Canvas 7 dòng là task hiện tại của bạn.")
        if "tiến độ" in question:
            return AIMessage(content="Nhóm đã xong 2/5 task.")
        if "cần nộp" in question:
            return AIMessage(content="CP1: Canvas 7 dòng và các deliverable tiếp theo.")
        return AIMessage(content="Phản hồi từ mô hình kiểm thử.")


class FailingChatModel:
    model_name = "failing-chat-model"

    def invoke(self, messages):
        raise TimeoutError("provider timeout")


def make_client(chat_model=None) -> TestClient:
    class FakeRouterGraph:
        def invoke(self, state):
            assert state["operation"] == "assign_tasks"
            assert state["use_llm"] is True
            members = [member for member in state["members"] if member["skills"]]
            if not members:
                return {"status": "clarify", "assignments": [], "gaps": ["Missing skills"]}
            assignments = []
            for task in state["tasks"]:
                text = f"{task['title']} {task['deliverable']}".casefold()
                owner = max(
                    members,
                    key=lambda member: sum(skill.casefold() in text for skill in member["skills"]),
                )
                matched_skills = [skill for skill in owner["skills"] if skill.casefold() in text]
                assignments.append(
                    {
                        "task_id": task["id"],
                        "owner_id": owner["id"],
                        "matched_skills": matched_skills,
                        "reason": "Fake provider response for API contract test.",
                        "confidence": "high" if matched_skills else "low",
                    }
                )
            return {"status": "ready", "assignments": assignments, "gaps": []}

    settings = Settings(
        _env_file=None,
        app_debug=True,
        database_url="sqlite+pysqlite:///:memory:",
        database_auto_create=True,
    )
    app = create_app(settings, chat_model=chat_model or FakeChatModel())
    app.dependency_overrides[get_router_graph] = lambda: FakeRouterGraph()
    return TestClient(app)


def test_health_check() -> None:
    response = make_client().get("/api/v1/health")

    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_readiness_check_includes_database() -> None:
    with make_client() as client:
        response = client.get("/api/v1/ready")

    assert response.status_code == 200
    assert response.json() == {"status": "ok", "database": "connected"}


def test_assign_tasks_operation_returns_skill_evidence() -> None:
    response = make_client().post(
        "/api/v1/assignments/assign_tasks",
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
    assert body["assignments"][0]["matched_skills"] == ["AI", "Evaluation"]
    assert body["assignments"][0]["confidence"] == "high"


def test_assignment_draft_clarifies_missing_skills() -> None:
    with make_client() as client:
        response = client.post(
            "/api/v1/assignments/draft",
            json={
                "group_name": "Sloppers",
                "members": [{"name": "An", "skills": []}],
                "tasks": [
                    {"title": "Build API", "deliverable": "working endpoint"}
                ],
            },
        )

    assert response.status_code == 200
    assert response.json()["status"] == "clarify"


def test_lab_analysis_forwards_documents_to_llm_workflow() -> None:
    received_state = {}

    class FakeRouterGraph:
        def invoke(self, state):
            received_state.update(state)
            return {"status": "ready", "checklist_draft": {"checkpoints": []}, "gaps": []}

    app = create_app(Settings(app_debug=True))
    app.dependency_overrides[get_router_graph] = lambda: FakeRouterGraph()
    response = TestClient(app).post(
        "/api/v1/labs/analyze",
        json={
            "lab_id": "chatlog-1",
            "version": 2,
            "documents": [{"ref_id": "chatlog://1/source", "content": "Nộp canvas."}],
        },
    )

    assert response.status_code == 200
    assert received_state["use_llm"] is True
    assert received_state["mode"] == "full"
    assert received_state["lab_version"] == 2
    assert received_state["documents"][0]["ref_id"] == "chatlog://1/source"
    assert response.json()["checklist"] == {"checkpoints": []}


def test_assignment_can_load_canonical_tasks_saved_by_lab_version() -> None:
    received_state = {}

    class FakeRouterGraph:
        def invoke(self, state):
            received_state.update(state)
            task = state["tasks"][0]
            return {
                "status": "ready",
                "assignments": [
                    {
                        "task_id": task["id"],
                        "owner_id": "m1",
                        "matched_skills": ["Backend"],
                        "reason": "Backend khớp với FastAPI.",
                        "confidence": "high",
                    }
                ],
                "gaps": [],
            }

    class FakeChecklistStore:
        def load(self, lab_id, version):
            assert lab_id == "lab-101"
            assert version == 2
            return {
                "lab_id": lab_id,
                "lab_version": version,
                "checkpoints": [
                    {
                        "checkpoint_id": "cp1",
                        "tasks": [
                            {
                                "id": "canonical-task-1",
                                "title": "Implement REST endpoint",
                                "deliverable": "FastAPI route",
                                "description": "Implement API from canonical checklist.",
                                "required_skills": ["Backend"],
                                "checkpoint_id": "cp1",
                                "depends_on": [],
                                "estimated_effort": "small",
                            }
                        ],
                    }
                ],
            }

    app = create_app(Settings(app_debug=True))
    app.dependency_overrides[get_router_graph] = lambda: FakeRouterGraph()
    app.dependency_overrides[get_checklist_store] = lambda: FakeChecklistStore()

    response = TestClient(app).post(
        "/api/v1/assignments/assign_tasks",
        json={
            "group_name": "Sloppers",
            "members": [{"id": "m1", "name": "Dũng", "skills": ["Backend"]}],
            "lab_id": "lab-101",
            "version": 2,
        },
    )

    assert response.status_code == 200
    assert received_state["tasks"] == [
        {
            "id": "canonical-task-1",
            "title": "Implement REST endpoint",
            "deliverable": "FastAPI route",
            "description": "Implement API from canonical checklist.",
            "required_skills": ["Backend"],
            "checkpoint_id": "cp1",
            "depends_on": [],
            "estimated_effort": "small",
        }
    ]
    assert response.json()["assignments"][0]["task_id"] == "canonical-task-1"


def test_legacy_assignment_draft_persists_result() -> None:
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
    assert response.json()["status"] == "ready"
    assert record_count == 1


def test_chat_endpoint_uses_llm() -> None:
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
    assert "Canvas 7 dòng" in data["answer"]
    assert data["data"]["answer_source"] == "llm"


def test_chat_endpoint_reports_model_failure() -> None:
    with make_client(FailingChatModel()) as client:
        response = client.post(
            "/api/v1/chat",
            json={
                "message": "Xin chào",
                "user_id": "Trang",
                "group_id": "Sloppers",
            },
        )

    assert response.status_code == 502
    assert response.json()["detail"] == (
        "Không thể nhận phản hồi từ mô hình AI. Vui lòng thử lại."
    )
