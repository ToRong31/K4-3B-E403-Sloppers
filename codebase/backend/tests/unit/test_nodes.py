from src.agent.assignment import nodes
from src.agent.assignment.nodes import assign_tasks, validate_input
from src.models.schemas import AssignmentConfidence, AssignmentDraftResponse, DraftStatus


def test_validate_input_returns_clarify_without_skills() -> None:
    result = validate_input({"members": [{"id": "1", "name": "An", "skills": []}]})

    assert result["status"] == DraftStatus.CLARIFY
    assert result["gaps"]


def test_assign_tasks_prefers_matching_skill() -> None:
    result = assign_tasks(
        {
            "members": [
                {"id": "researcher", "name": "Trang", "skills": ["Research"]},
                {"id": "ai", "name": "Dương", "skills": ["AI"]},
            ],
            "tasks": [{"id": "task-1", "title": "AI evaluation", "deliverable": "golden set"}],
        }
    )

    assert result["assignments"][0]["owner_id"] == "ai"


def test_assign_tasks_marks_unmatched_workload_assignment_as_low_confidence() -> None:
    result = assign_tasks(
        {
            "members": [
                {"id": "ui", "name": "Trang", "skills": ["UI"]},
                {"id": "ai", "name": "Dương", "skills": ["AI"]},
            ],
            "tasks": [{"id": "task-1", "title": "Present the demo", "deliverable": "slides"}],
        }
    )

    assignment = result["assignments"][0]
    assert assignment["confidence"] == "low"
    assert assignment["matched_skills"] == []
    assert result["gaps"]


def test_assign_tasks_uses_configured_llm_when_requested(monkeypatch) -> None:
    class FakeModel:
        def with_structured_output(self, _schema):
            return self

        def invoke(self, _messages):
            return AssignmentDraftResponse.model_validate(
                {
                    "status": "ready",
                    "assignments": [
                        {
                            "task_id": "task-1",
                            "owner_id": "ai",
                            "matched_skills": ["AI"],
                            "reason": "Kỹ năng tự khai phù hợp: AI.",
                            "confidence": "high",
                        }
                    ],
                    "gaps": [],
                }
            )

    monkeypatch.setattr(nodes, "build_chat_model", lambda: FakeModel())
    result = assign_tasks(
        {
            "use_llm": True,
            "group_name": "Sloppers",
            "members": [{"id": "ai", "name": "Dương", "skills": ["AI"]}],
            "tasks": [{"id": "task-1", "title": "AI evaluation", "deliverable": "golden set"}],
        }
    )

    assert result["status"] == "ready"
    assert result["assignments"][0]["confidence"] == AssignmentConfidence.HIGH


def test_llm_assignment_accepts_semantic_match_from_declared_skill(monkeypatch) -> None:
    class FakeModel:
        def with_structured_output(self, _schema, **_kwargs):
            return self

        def invoke(self, _messages):
            return AssignmentDraftResponse.model_validate(
                {
                    "status": "ready",
                    "assignments": [
                        {
                            "task_id": "task-1",
                            "owner_id": "backend-member",
                            "matched_skills": ["backend"],
                            "reason": "Backend phù hợp với việc hiện thực FastAPI route.",
                            "confidence": "high",
                        }
                    ],
                    "gaps": [],
                }
            )

    monkeypatch.setattr(nodes, "build_chat_model", lambda: FakeModel())
    result = assign_tasks(
        {
            "use_llm": True,
            "group_name": "Sloppers",
            "members": [
                {"id": "backend-member", "name": "Dũng", "skills": ["Backend"]}
            ],
            "tasks": [
                {
                    "id": "task-1",
                    "title": "Implement REST endpoint",
                    "deliverable": "FastAPI route",
                }
            ],
        }
    )

    assert result["status"] == "ready"
    assert result["assignments"][0]["matched_skills"] == ["Backend"]


def test_llm_assignment_sanitizes_skill_not_declared_by_owner(monkeypatch) -> None:
    class FakeModel:
        def with_structured_output(self, _schema, **_kwargs):
            return self

        def invoke(self, _messages):
            return AssignmentDraftResponse.model_validate(
                {
                    "status": "ready",
                    "assignments": [
                        {
                            "task_id": "task-1",
                            "owner_id": "backend-member",
                            "matched_skills": ["Testing"],
                            "reason": "Skill không có trong hồ sơ người dùng.",
                            "confidence": "high",
                        }
                    ],
                    "gaps": [],
                }
            )

    monkeypatch.setattr(nodes, "build_chat_model", lambda: FakeModel())
    result = assign_tasks(
        {
            "use_llm": True,
            "group_name": "Sloppers",
            "members": [
                {"id": "backend-member", "name": "Dũng", "skills": ["Backend"]}
            ],
            "tasks": [
                {
                    "id": "task-1",
                    "title": "Implement REST endpoint",
                    "deliverable": "FastAPI route",
                }
            ],
        }
    )

    assert result["status"] == "ready"
    assert result["assignments"][0]["matched_skills"] == []
    assert result["assignments"][0]["confidence"] == AssignmentConfidence.LOW
    assert "Testing" not in result["assignments"][0]["reason"]
    assert result["gaps"]


def test_llm_assignment_keeps_declared_skill_and_downgrades_inferred_skill(
    monkeypatch,
) -> None:
    class FakeModel:
        def with_structured_output(self, _schema, **_kwargs):
            return self

        def invoke(self, _messages):
            return AssignmentDraftResponse.model_validate(
                {
                    "status": "ready",
                    "assignments": [
                        {
                            "task_id": "task-1",
                            "owner_id": "backend-member",
                            "matched_skills": ["backend", "Testing"],
                            "reason": "Backend và Testing phù hợp với task.",
                            "confidence": "high",
                        }
                    ],
                    "gaps": [],
                }
            )

    monkeypatch.setattr(nodes, "build_chat_model", lambda: FakeModel())
    result = assign_tasks(
        {
            "use_llm": True,
            "group_name": "Sloppers",
            "members": [
                {"id": "backend-member", "name": "Dũng", "skills": ["Backend"]}
            ],
            "tasks": [
                {
                    "id": "task-1",
                    "title": "Implement REST endpoint",
                    "deliverable": "FastAPI route",
                }
            ],
        }
    )

    assignment = result["assignments"][0]
    assert result["status"] == "ready"
    assert assignment["matched_skills"] == ["Backend"]
    assert assignment["confidence"] == AssignmentConfidence.MEDIUM
    assert "Testing" not in assignment["reason"]
    assert result["gaps"]


def test_llm_assignment_restores_translated_skill_to_declared_label(monkeypatch) -> None:
    class FakeModel:
        def with_structured_output(self, _schema, **_kwargs):
            return self

        def invoke(self, _messages):
            return AssignmentDraftResponse.model_validate(
                {
                    "status": "ready",
                    "assignments": [
                        {
                            "task_id": "task-1",
                            "owner_id": "ai-member",
                            "matched_skills": ["Học máy", "Phân tích dữ liệu"],
                            "reason": "Kỹ năng phù hợp với task AI.",
                            "confidence": "high",
                        }
                    ],
                    "gaps": [],
                }
            )

    monkeypatch.setattr(nodes, "build_chat_model", lambda: FakeModel())
    result = assign_tasks(
        {
            "use_llm": True,
            "group_name": "Sloppers",
            "members": [
                {
                    "id": "ai-member",
                    "name": "Trọng",
                    "skills": ["Machine Learning", "Data Analysis"],
                }
            ],
            "tasks": [
                {
                    "id": "task-1",
                    "title": "Evaluate the AI pipeline",
                    "deliverable": "Metrics report",
                }
            ],
        }
    )

    assignment = result["assignments"][0]
    assert assignment["matched_skills"] == ["Machine Learning", "Data Analysis"]
    assert assignment["confidence"] == AssignmentConfidence.HIGH
    assert result["gaps"] == []


def test_llm_assignment_repairs_copied_task_id_at_same_position() -> None:
    draft = AssignmentDraftResponse.model_validate(
        {
            "status": "ready",
            "assignments": [
                {
                    "task_id": "task-1",
                    "owner_id": "member-1",
                    "matched_skills": ["Backend"],
                    "reason": "Backend phù hợp.",
                    "confidence": "high",
                },
                {
                    "task_id": "task-2-typo",
                    "owner_id": "member-1",
                    "matched_skills": ["Backend"],
                    "reason": "Backend phù hợp.",
                    "confidence": "high",
                },
            ],
            "gaps": [],
        }
    )
    state = {
        "members": [{"id": "member-1", "name": "Dũng", "skills": ["Backend"]}],
        "tasks": [
            {"id": "task-1", "title": "One", "deliverable": "One"},
            {"id": "task-2", "title": "Two", "deliverable": "Two"},
        ],
    }

    result, rejection_reason = nodes._validate_llm_draft(draft, state)

    assert rejection_reason is None
    assert result is not None
    assert [item["task_id"] for item in result["assignments"]] == ["task-1", "task-2"]


def test_llm_assignment_does_not_repair_unknown_task_id_at_wrong_position() -> None:
    draft = AssignmentDraftResponse.model_validate(
        {
            "status": "ready",
            "assignments": [
                {
                    "task_id": "task-2-typo",
                    "owner_id": "member-1",
                    "matched_skills": ["Backend"],
                    "reason": "Backend phù hợp.",
                    "confidence": "high",
                },
                {
                    "task_id": "task-1",
                    "owner_id": "member-1",
                    "matched_skills": ["Backend"],
                    "reason": "Backend phù hợp.",
                    "confidence": "high",
                },
            ],
            "gaps": [],
        }
    )
    state = {
        "members": [{"id": "member-1", "name": "Dũng", "skills": ["Backend"]}],
        "tasks": [
            {"id": "task-1", "title": "One", "deliverable": "One"},
            {"id": "task-2", "title": "Two", "deliverable": "Two"},
        ],
    }

    result, rejection_reason = nodes._validate_llm_draft(draft, state)

    assert result is None
    assert rejection_reason is not None
    assert rejection_reason.startswith("task_coverage_mismatch")
