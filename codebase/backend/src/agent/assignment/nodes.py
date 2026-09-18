from uuid import uuid4

from src.agent.assignment.state import AssignmentState
from src.agent.assignment.tools import (
    extract_skill_names,
    get_assignment_context,
    score_assignment_candidates,
    validate_assignment_draft,
)
from src.models.assignments import Confidence
from src.models.schemas import DraftStatus


def load_assignment_context_node(state: AssignmentState) -> AssignmentState:
    """Load context from fixtures if members or tasks are missing, and normalize structure."""
    members = state.get("members") or []
    tasks = state.get("tasks") or []
    group_id = state.get("group_id")
    checklist_id = state.get("checklist_id")

    if not members or not tasks:
        loaded = get_assignment_context(group_id=group_id, checklist_id=checklist_id)
        if not members:
            members = loaded.get("members", [])
        if not tasks:
            tasks = loaded.get("tasks", [])
        if not group_id:
            group_id = loaded.get("group_id")
        if not checklist_id:
            checklist_id = loaded.get("checklist_id")

    # Normalize member IDs and skills
    normalized_members = []
    for m in members:
        member_id = str(m.get("id") or m.get("member_id", ""))
        skills = extract_skill_names(m.get("skills", []))
        normalized_members.append({
            "id": member_id,
            "member_id": member_id,
            "name": m.get("name", ""),
            "skills": skills,
            "available_effort": int(m.get("available_effort", 3)),
        })

    # Normalize tasks
    normalized_tasks = []
    for t in tasks:
        task_id = str(t.get("id", ""))
        normalized_tasks.append({
            "id": task_id,
            "title": str(t.get("title", "")),
            "deliverable": str(t.get("deliverable", "")),
            "description": str(t.get("description", "")),
            "required_skills": t.get("required_skills", []),
        })

    return {
        "group_id": str(group_id) if group_id else state.get("group_id", ""),
        "checklist_id": str(checklist_id) if checklist_id else state.get("checklist_id", ""),
        "members": normalized_members,
        "tasks": normalized_tasks,
    }


def validate_members_and_skills(state: AssignmentState) -> AssignmentState:
    """Validate that at least one member has self-declared skills and tasks are present."""
    members = state.get("members", [])
    members_with_skills = [
        m for m in members
        if extract_skill_names(m.get("skills", []))
    ]
    if not members_with_skills:
        return {
            "status": DraftStatus.CLARIFY,
            "assignments": [],
            "gaps": ["Ít nhất một thành viên cần khai báo kỹ năng trước khi phân công."],
        }

    tasks = state.get("tasks", [])
    if not tasks:
        return {
            "status": DraftStatus.CLARIFY,
            "assignments": [],
            "gaps": ["Chưa có danh sách task để phân công."],
        }

    return {"status": DraftStatus.READY, "gaps": []}


def route_after_validation(state: AssignmentState) -> str:
    return "clarify" if state.get("status") == DraftStatus.CLARIFY else "score"


def request_clarification(state: AssignmentState) -> AssignmentState:
    return {
        "status": DraftStatus.CLARIFY,
        "assignments": [],
        "gaps": state.get("gaps", []),
    }


def score_candidates(state: AssignmentState) -> AssignmentState:
    """Pre-score candidates for each task based on skills and baseline effort."""
    members = [m for m in state.get("members", []) if extract_skill_names(m.get("skills", []))]
    workload = {str(m["id"]): 0 for m in members}
    candidate_scores = {}

    for task in state.get("tasks", []):
        task_id = str(task["id"])
        candidate_scores[task_id] = score_assignment_candidates(task, members, workload)

    return {"candidate_scores": candidate_scores}


def build_assignment_draft(state: AssignmentState) -> AssignmentState:
    """Greedily assign each task to the highest-scoring candidate, balancing workload."""
    members = [m for m in state.get("members", []) if extract_skill_names(m.get("skills", []))]
    workload = {str(m["id"]): 0 for m in members}
    assignments = []
    has_unmatched_task = False

    for task in state.get("tasks", []):
        candidates = score_assignment_candidates(task, members, workload)
        if not candidates:
            continue

        best = candidates[0]
        chosen_id = best["member_id"]
        workload[chosen_id] += 1

        if best["match_count"] == 0:
            has_unmatched_task = True
            confidence = Confidence.LOW.value
            reason = "Chưa có skill khớp trực tiếp; tạm cân bằng số task trong nhóm."
        else:
            confidence = Confidence.HIGH.value
            reason = (
                f"Kỹ năng tự khai ({', '.join(best['matched_skills'])}) khớp nội dung task."
                if best["matched_skills"]
                else "Kỹ năng tự khai khớp nội dung task."
            )

        assignments.append({
            "task_id": task["id"],
            "owner_id": chosen_id,
            "matched_skills": best["matched_skills"],
            "reason": reason,
            "confidence": confidence,
        })

    gaps = list(state.get("gaps", []))
    unmatched_warning = "Có task chưa khớp skill; nhóm cần kiểm tra trước khi xác nhận."
    if has_unmatched_task and unmatched_warning not in gaps:
        gaps.append(unmatched_warning)

    return {
        "status": DraftStatus.READY,
        "assignments": assignments,
        "gaps": gaps,
    }


def validate_assignment_draft_node(state: AssignmentState) -> AssignmentState:
    """Validate assignment draft output before completion."""
    tasks = state.get("tasks", [])
    members = state.get("members", [])
    assignments = state.get("assignments", [])

    validation = validate_assignment_draft(tasks, members, assignments)
    if not validation["valid"]:
        return {
            "status": DraftStatus.CLARIFY,
            "assignments": assignments,
            "gaps": validation["errors"] + validation["gaps"],
        }

    plan = {
        "assignment_draft_id": str(uuid4()),
        "group_id": state.get("group_id") or "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        "checklist_id": state.get("checklist_id") or "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
        "status": "pending_confirmation",
        "assignments": assignments,
        "gaps": validation["gaps"],
    }

    return {
        "status": DraftStatus.READY,
        "assignments": assignments,
        "gaps": validation["gaps"],
        "assignment_plan": plan,
    }


# Backwards compatibility aliases
def validate_input(state: AssignmentState) -> AssignmentState:
    """Backwards compatible alias for validate_members_and_skills."""
    norm = load_assignment_context_node(state)
    merged = {**state, **norm}
    return validate_members_and_skills(merged)


def assign_tasks(state: AssignmentState) -> AssignmentState:
    """Backwards compatible function running full assignment workflow."""
    norm = load_assignment_context_node(state)
    merged = {**state, **norm}
    scored = score_candidates(merged)
    merged = {**merged, **scored}
    draft = build_assignment_draft(merged)
    merged = {**merged, **draft}
    validated = validate_assignment_draft_node(merged)
    return {
        "status": validated["status"],
        "assignments": validated["assignments"],
        "gaps": validated["gaps"],
    }
