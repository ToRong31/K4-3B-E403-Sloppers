import json
from pathlib import Path
from uuid import uuid4

import pytest

from src.agent.assignment.graph import assignment_graph
from src.agent.assignment.tools import (
    calculate_member_workload,
    get_assignment_context,
    save_assignment_draft,
    score_assignment_candidates,
    validate_assignment_draft,
)
from src.models.assignments import AssignmentPlan, Confidence
from src.models.schemas import DraftStatus

FIXTURE_DIR = Path(__file__).parents[2] / "examples_data" / "fixtures"


def test_get_assignment_context_loads_fixtures() -> None:
    context = get_assignment_context()

    assert context["group_name"] == "Sloppers"
    assert len(context["members"]) == 3
    assert len(context["tasks"]) >= 3
    # Verify members have parsed skills
    duong = next(m for m in context["members"] if m["name"] == "Dương")
    assert "AI" in duong["skills"]


def test_calculate_member_workload() -> None:
    current_tasks = [
        {"id": "t1", "owner_id": "member-1"},
        {"id": "t2", "owner_id": "member-2"},
        {"id": "t3", "owner_id": "member-1"},
    ]

    assert calculate_member_workload("member-1", current_tasks) == 2
    assert calculate_member_workload("member-2", current_tasks) == 1
    assert calculate_member_workload("member-3", current_tasks) == 0


def test_score_assignment_candidates_matching_and_unmatched() -> None:
    members = [
        {"id": "m1", "name": "Dương", "skills": ["AI", "Evaluation"], "available_effort": 4},
        {"id": "m2", "name": "Dũng", "skills": ["Backend", "Testing"], "available_effort": 3},
    ]
    task_ai = {
        "id": "t1",
        "title": "Build AI Model",
        "deliverable": "model weights",
        "required_skills": ["AI"],
    }
    task_unmatched = {
        "id": "t2",
        "title": "Design Logo",
        "deliverable": "logo.png",
        "required_skills": ["Photoshop"],
    }

    # For AI task, Dương should be top candidate with HIGH confidence
    candidates_ai = score_assignment_candidates(task_ai, members, {"m1": 0, "m2": 0})
    assert candidates_ai[0]["member_id"] == "m1"
    assert candidates_ai[0]["confidence"] == Confidence.HIGH
    assert "AI" in candidates_ai[0]["matched_skills"]

    # For unmatched task, should assign with LOW confidence
    candidates_unmatched = score_assignment_candidates(task_unmatched, members, {"m1": 2, "m2": 0})
    assert candidates_unmatched[0]["member_id"] == "m2"  # m2 has lower workload
    assert candidates_unmatched[0]["confidence"] == Confidence.LOW


def test_validate_assignment_draft_catches_anomalies() -> None:
    tasks = [{"id": "t1"}, {"id": "t2"}]
    members = [{"id": "m1"}, {"id": "m2"}]

    # Case 1: Missing task t2
    assignments_missing = [
        {"task_id": "t1", "owner_id": "m1", "reason": "Good", "confidence": "high"}
    ]
    res1 = validate_assignment_draft(tasks, members, assignments_missing)
    assert res1["valid"] is False
    assert any("chưa được phân công" in err for err in res1["errors"])

    # Case 2: Duplicate task t1
    assignments_dup = [
        {"task_id": "t1", "owner_id": "m1", "reason": "Good", "confidence": "high"},
        {"task_id": "t1", "owner_id": "m2", "reason": "Good", "confidence": "high"},
    ]
    res2 = validate_assignment_draft(tasks, members, assignments_dup)
    assert res2["valid"] is False
    assert any("nhiều hơn 1 lần" in err for err in res2["errors"])

    # Case 3: Invalid owner
    assignments_invalid_owner = [
        {"task_id": "t1", "owner_id": "m1", "reason": "Good", "confidence": "high"},
        {"task_id": "t2", "owner_id": "stranger", "reason": "Good", "confidence": "high"},
    ]
    res3 = validate_assignment_draft(tasks, members, assignments_invalid_owner)
    assert res3["valid"] is False
    assert any("không thuộc thành viên" in err for err in res3["errors"])


def test_save_assignment_draft_enforces_pending_confirmation() -> None:
    t_id = uuid4()
    m_id = uuid4()
    g_id = uuid4()
    c_id = uuid4()

    valid_payload = {
        "group_id": g_id,
        "checklist_id": c_id,
        "status": "pending_confirmation",
        "assignments": [
            {
                "task_id": t_id,
                "owner_id": m_id,
                "matched_skills": ["AI"],
                "reason": "Khớp skill",
                "confidence": "high",
            }
        ],
        "gaps": [],
    }

    saved = save_assignment_draft(g_id, valid_payload)
    assert saved.status == "pending_confirmation"

    # Must reject active or confirmed status
    invalid_payload = dict(valid_payload)
    invalid_payload["status"] = "confirmed"
    with pytest.raises(ValueError, match="pending_confirmation"):
        save_assignment_draft(g_id, invalid_payload)


def test_subgraph_happy_path_with_fixture_context() -> None:
    # Invoking with group_id and checklist_id from existing fixtures
    result = assignment_graph.invoke({
        "group_id": "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        "checklist_id": "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
    })

    assert result["status"] == DraftStatus.READY
    assert len(result["assignments"]) == 3
    # Check that each assignment has an owner, matched_skills, confidence, and reason
    for item in result["assignments"]:
        assert item["owner_id"] in [
            "11111111-1111-4111-8111-111111111111",
            "22222222-2222-4222-8222-222222222222",
            "33333333-3333-4333-8333-333333333333",
        ]
        assert item["confidence"] in ["high", "medium", "low"]
        assert len(item["reason"]) > 0

    # Ensure assignment_plan in state validates against AssignmentPlan model
    plan = AssignmentPlan.model_validate(result["assignment_plan"])
    assert plan.status == "pending_confirmation"


def test_subgraph_workload_balancing() -> None:
    # 2 members with the same skill "Python", 4 tasks
    members = [
        {"id": "dev1", "name": "Dev 1", "skills": ["Python"], "available_effort": 3},
        {"id": "dev2", "name": "Dev 2", "skills": ["Python"], "available_effort": 3},
    ]
    tasks = [
        {"id": f"t{i}", "title": f"Python task {i}", "deliverable": f"code {i}"}
        for i in range(4)
    ]

    result = assignment_graph.invoke({"members": members, "tasks": tasks})

    assert result["status"] == DraftStatus.READY
    owners = [a["owner_id"] for a in result["assignments"]]
    # Workload should be balanced: 2 tasks for each dev
    assert owners.count("dev1") == 2
    assert owners.count("dev2") == 2


def test_subgraph_handles_unmatched_task_with_gap_flag() -> None:
    # Task requires skill nobody has
    members = [
        {"id": "m1", "name": "Dương", "skills": ["AI"], "available_effort": 3},
    ]
    tasks = [
        {
            "id": "t1",
            "title": "Setup Kubernetes cluster",
            "deliverable": "k8s yaml",
            "required_skills": ["DevOps"],
        },
    ]

    result = assignment_graph.invoke({"members": members, "tasks": tasks})

    assert result["status"] == DraftStatus.READY
    assert result["assignments"][0]["owner_id"] == "m1"
    assert result["assignments"][0]["confidence"] == "low"
    assert any("chưa khớp skill" in gap for gap in result["gaps"])


def test_subgraph_clarifies_when_no_skills_declared() -> None:
    # Load no-skills fixture data
    no_skills_path = FIXTURE_DIR / "group_snapshot_no_skills.json"
    data = json.loads(no_skills_path.read_text(encoding="utf-8"))

    result = assignment_graph.invoke({
        "members": data["members"],
        "tasks": [{"id": "t1", "title": "Any task", "deliverable": "out"}],
    })

    assert result["status"] == DraftStatus.CLARIFY
    assert len(result["assignments"]) == 0
    assert any("khai báo kỹ năng" in gap for gap in result["gaps"])
