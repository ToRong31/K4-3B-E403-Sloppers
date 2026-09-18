from fastapi.testclient import TestClient

from src.api.deps import get_checklist_store, get_router_graph
from src.api.main import create_app
from src.core.config import Settings


def make_client() -> TestClient:
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

    app = create_app(Settings(app_debug=True))
    app.dependency_overrides[get_router_graph] = lambda: FakeRouterGraph()
    return TestClient(app)


def test_health_check() -> None:
    response = make_client().get("/api/v1/health")

    assert response.status_code == 200
    assert response.json()["status"] == "ok"


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
