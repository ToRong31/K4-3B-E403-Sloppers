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


class CapturingChatModel:
    model_name = "capturing-chat-model"

    def __init__(self):
        self.messages = []

    def invoke(self, messages):
        self.messages = messages
        return AIMessage(content="Task thực tế đã được đọc từ LabSpace.")


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
                "tasks": [
                    {
                        "id": "actual-task",
                        "title": "Canvas 7 dòng",
                        "owner": "Trọng",
                        "status": "todo",
                        "deliverable": "canvas.md",
                    }
                ],
            },
        )

    assert response.status_code == 200
    data = response.json()
    assert "Canvas 7 dòng" in data["answer"]
    assert data["data"]["answer_source"] == "llm"
    assert data["task_ids"] == ["actual-task"]


def test_chat_grounds_llm_with_current_request_tasks_only() -> None:
    model = CapturingChatModel()
    with make_client(model) as client:
        response = client.post(
            "/api/v1/chat",
            json={
                "message": "Tôi đang có task gì?",
                "user_id": "Trọng",
                "group_id": "group-current",
                "tasks": [
                    {
                        "id": "repo-task",
                        "title": "Nộp link repository công khai",
                        "owner": "Trọng",
                        "status": "todo",
                        "deliverable": "Repository công khai",
                        "completion_criteria": ["Link truy cập được"],
                    }
                ],
            },
        )

    assert response.status_code == 200
    system_prompt = model.messages[0].content
    assert "Nộp link repository công khai" in system_prompt
    assert "Link truy cập được" in system_prompt
    assert "Khảo sát và tổng hợp pain" not in system_prompt
    assert response.json()["task_ids"] == ["repo-task"]


def test_chat_does_not_fall_back_to_seed_tasks() -> None:
    model = CapturingChatModel()
    with make_client(model) as client:
        response = client.post(
            "/api/v1/chat",
            json={
                "message": "Tôi đang có task gì?",
                "user_id": "Trọng",
                "group_id": "group-current",
                "tasks": [],
            },
        )

    assert response.status_code == 200
    assert "Chưa có task nào được giao" in model.messages[0].content
    assert response.json()["task_ids"] == []


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


def test_group_chat_message_and_attachment_persisted_to_db() -> None:
    client = make_client()
    msg_payload = {
        "id": "msg-test-1001",
        "groupId": "group-sloppers",
        "senderId": "user-test-1",
        "senderCode": "21010001",
        "author": "Nguyễn Văn A",
        "shortName": "A",
        "initial": "A",
        "role": "Thành viên",
        "isLeader": False,
        "time": "14:30",
        "text": "Mình gửi file báo cáo nè",
        "file": {
            "name": "bao_cao_lab.pdf",
            "size": "1.2 MB",
            "type": "application/pdf",
            "dataUrl": "data:application/pdf;base64,JVBERi0xLjQK...",
        },
    }
    post_res = client.post("/api/v1/groups/current/chat", json=msg_payload)
    assert post_res.status_code == 200

    get_res = client.get("/api/v1/groups/current/chat")
    assert get_res.status_code == 200
    messages = get_res.json()
    assert any(m.get("id") == "msg-test-1001" and m.get("file", {}).get("name") == "bao_cao_lab.pdf" for m in messages)


def test_group_chat_history_is_scoped_to_requested_group() -> None:
    with make_client() as client:
        for group_id, message_id in (("group-a", "msg-group-a"), ("group-b", "msg-group-b")):
            response = client.post(
                "/api/v1/groups/current/chat",
                json={"id": message_id, "groupId": group_id, "author": group_id, "text": message_id},
            )
            assert response.status_code == 200

        group_a = client.get("/api/v1/groups/current/chat?groupId=group-a")
        group_b = client.get("/api/v1/groups/current/chat?groupId=group-b")
        new_group = client.get("/api/v1/groups/current/chat?groupId=group-new")

        assert [item["id"] for item in group_a.json()] == ["msg-group-a"]
        assert [item["id"] for item in group_b.json()] == ["msg-group-b"]
        assert new_group.json() == []


def test_file_upload_and_list_endpoints() -> None:
    client = make_client()
    upload_res = client.post(
        "/api/v1/files/upload",
        json={
            "filename": "diagram.png",
            "content_type": "image/png",
            "file_url": "data:image/png;base64,iVBORw0KGgo...",
            "size_bytes": 1024,
            "group_id": "group-sloppers",
            "channel": "group",
            "is_image": True,
        },
    )
    assert upload_res.status_code == 200
    data = upload_res.json()
    assert data["filename"] == "diagram.png"
    assert data["is_image"] is True
    assert "id" in data

    list_res = client.get("/api/v1/groups/current/files")
    assert list_res.status_code == 200
    files = list_res.json()
    assert any(f.get("filename") == "diagram.png" for f in files)


def test_ai_chat_history_persistence_and_clear() -> None:
    model = CapturingChatModel()
    with make_client(model) as client:
        # 1. Send chat message
        post_res = client.post(
            "/api/v1/chat",
            json={
                "message": "Làm thế nào để chạy kiểm thử backend?",
                "user_id": "test-user-01",
                "group_id": "group-test-01",
                "thread_id": "group-test-01:test-user-01",
                "attachment_name": "note.txt",
                "attachment_type": "text/plain",
                "attachment_url": "data:text/plain;base64,SGVsbG8=",
                "tasks": [],
            },
        )
        assert post_res.status_code == 200

        # 2. Get history
        hist_res = client.get("/api/v1/chat/history?thread_id=group-test-01:test-user-01")
        assert hist_res.status_code == 200
        history = hist_res.json()
        assert len(history) >= 2
        user_msg = next((m for m in history if m["role"] == "user"), None)
        bot_msg = next((m for m in history if m["role"] == "assistant"), None)
        assert user_msg is not None
        assert "Làm thế nào để chạy kiểm thử backend?" in user_msg["answer"]
        assert user_msg["file"]["name"] == "note.txt"
        assert bot_msg is not None

        # 3. Clear history
        del_res = client.delete("/api/v1/chat/history?thread_id=group-test-01:test-user-01")
        assert del_res.status_code == 200
        assert del_res.json()["status"] == "cleared"

        # 4. Check history after clear
        empty_res = client.get("/api/v1/chat/history?thread_id=group-test-01:test-user-01")
        assert empty_res.status_code == 200
        assert len(empty_res.json()) == 0


