import json
from collections import Counter
from pathlib import Path
from typing import Any
from uuid import UUID

from src.models.assignments import AssignmentPlan, Confidence

FIXTURE_DIR = Path(__file__).parents[3] / "examples_data" / "fixtures"


def get_assignment_context(
    group_id: str | UUID | None = None,
    checklist_id: str | UUID | None = None,
    fixture_dir: Path | None = None,
) -> dict[str, Any]:
    """Load group and checklist context from fixtures or defaults."""
    dir_path = fixture_dir or FIXTURE_DIR
    target_group_id = str(group_id) if group_id else None
    target_checklist_id = str(checklist_id) if checklist_id else None

    # Load group snapshot
    group_data: dict[str, Any] | None = None
    for file_path in dir_path.glob("group_snapshot*.json"):
        try:
            content = json.loads(file_path.read_text(encoding="utf-8"))
            if target_group_id is None or str(content.get("group_id")) == target_group_id:
                group_data = content
                break
        except Exception:
            continue

    if group_data is None:
        default_group_file = dir_path / "group_snapshot.json"
        if default_group_file.exists():
            group_data = json.loads(default_group_file.read_text(encoding="utf-8"))

    # Load checklist draft
    checklist_data: dict[str, Any] | None = None
    for file_path in dir_path.glob("checklist_draft*.json"):
        try:
            content = json.loads(file_path.read_text(encoding="utf-8"))
            match_id = str(content.get("checklist_id")) == target_checklist_id
            if target_checklist_id is None or match_id:
                checklist_data = content
                break
        except Exception:
            continue

    if checklist_data is None:
        default_checklist_file = dir_path / "checklist_draft.json"
        if default_checklist_file.exists():
            checklist_data = json.loads(default_checklist_file.read_text(encoding="utf-8"))

    # Extract members
    members = []
    if group_data and "members" in group_data:
        for m in group_data["members"]:
            member_skills = []
            for s in m.get("skills", []):
                if isinstance(s, dict) and "name" in s:
                    member_skills.append(s["name"])
                elif isinstance(s, str):
                    member_skills.append(s)
            members.append({
                "id": str(m.get("member_id") or m.get("id")),
                "name": m.get("name", ""),
                "skills": member_skills,
                "available_effort": m.get("available_effort", 3),
            })

    # Extract tasks
    tasks = []
    if checklist_data and "checkpoints" in checklist_data:
        for cp in checklist_data["checkpoints"]:
            for t in cp.get("tasks", []):
                tasks.append({
                    "id": str(t.get("id")),
                    "task_key": t.get("task_key", ""),
                    "checkpoint_id": str(cp.get("checkpoint_id", "")),
                    "task_order": t.get("task_order", 1),
                    "title": t.get("title", ""),
                    "description": t.get("description", ""),
                    "deliverable": t.get("deliverable", ""),
                    "required_skills": t.get("required_skills", []),
                    "depends_on": t.get("depends_on", []),
                    "reference_ids": t.get("reference_ids", []),
                })

    return {
        "group_id": str(group_data.get("group_id")) if group_data else target_group_id,
        "group_name": group_data.get("name", "") if group_data else "",
        "checklist_id": (
            str(checklist_data.get("checklist_id")) if checklist_data else target_checklist_id
        ),
        "members": members,
        "tasks": tasks,
    }


def extract_skill_names(skills: list[Any]) -> list[str]:
    """Helper to extract normalized string skill names."""
    names = []
    for s in skills:
        if isinstance(s, str):
            names.append(s.strip())
        elif isinstance(s, dict) and "name" in s:
            names.append(str(s["name"]).strip())
        elif hasattr(s, "name"):
            names.append(str(s.name).strip())
    return [n for n in names if n]


def match_task_skills(
    task: dict[str, Any] | str,
    member_skills: list[Any],
) -> tuple[int, list[str]]:
    """Match a member's skills against a task's required_skills, title, and deliverable."""
    skill_names = extract_skill_names(member_skills)
    if not skill_names:
        return 0, []

    if isinstance(task, str):
        task_text = task.casefold()
        task_required = set()
    else:
        title = str(task.get("title", "")).casefold()
        description = str(task.get("description", "")).casefold()
        deliverable = str(task.get("deliverable", "")).casefold()
        task_text = f"{title} {description} {deliverable}"
        task_required = {
            str(s).strip().casefold()
            for s in task.get("required_skills", [])
            if str(s).strip()
        }

    matched: list[str] = []
    for skill in skill_names:
        norm_skill = skill.casefold()
        # Direct requirement match
        if norm_skill in task_required:
            matched.append(skill)
        # Content match
        elif norm_skill in task_text:
            matched.append(skill)

    # Unique preserving order
    unique_matched = list(dict.fromkeys(matched))
    return len(unique_matched), unique_matched


def calculate_member_workload(
    member_id: str | UUID,
    current_tasks: list[dict[str, Any]],
) -> int:
    """Calculate the number of tasks assigned to a member."""
    target_id = str(member_id)
    return sum(
        1
        for t in current_tasks
        if str(t.get("owner_id", "")) == target_id
    )


def score_assignment_candidates(
    task: dict[str, Any],
    members: list[dict[str, Any]],
    workload: dict[str, int],
) -> list[dict[str, Any]]:
    """Score all members as candidates for a task based on skills, workload, and availability."""
    candidates = []
    for member in members:
        member_id = str(member.get("id") or member.get("member_id", ""))
        member_name = member.get("name", "")
        member_skills = member.get("skills", [])
        available_effort = int(member.get("available_effort", 3))
        current_workload = workload.get(member_id, 0)

        match_count, matched_skills = match_task_skills(task, member_skills)

        # Composite score
        # 1. Matching skill is paramount (+100 per matched skill)
        # 2. Lower workload is preferred (-10 per current task)
        # 3. Available effort bonus (+1 per available effort point)
        score = (match_count * 100) - (current_workload * 10) + available_effort

        if match_count > 0:
            confidence = Confidence.HIGH
            skills_str = ", ".join(matched_skills)
            reason = f"Kỹ năng tự khai ({skills_str}) khớp trực tiếp với yêu cầu task."
        else:
            confidence = Confidence.LOW
            reason = "Chưa có skill khớp trực tiếp; tạm cân bằng theo khối lượng việc trong nhóm."

        candidates.append({
            "member_id": member_id,
            "member_name": member_name,
            "matched_skills": matched_skills,
            "match_count": match_count,
            "workload": current_workload,
            "available_effort": available_effort,
            "score": score,
            "confidence": confidence,
            "reason": reason,
        })

    # Sort candidates by: has matched skills first, higher score, lower workload
    candidates.sort(
        key=lambda c: (
            c["match_count"] > 0,
            c["score"],
            -c["workload"],
            c["available_effort"],
        ),
        reverse=True,
    )
    return candidates


def validate_assignment_draft(
    tasks: list[dict[str, Any]],
    members: list[dict[str, Any]],
    assignments: list[dict[str, Any]],
) -> dict[str, Any]:
    """Validate assignment draft: 100% tasks assigned, 1 owner per task, owners in group."""
    errors: list[str] = []
    gaps: list[str] = []

    expected_task_ids = {str(t.get("id")) for t in tasks if t.get("id")}
    valid_member_ids = {
        str(m.get("id") or m.get("member_id"))
        for m in members
        if (m.get("id") or m.get("member_id"))
    }

    assigned_task_ids = [str(a.get("task_id")) for a in assignments if a.get("task_id")]
    counts = Counter(assigned_task_ids)

    # Check duplicates
    duplicates = [tid for tid, count in counts.items() if count > 1]
    if duplicates:
        errors.append(f"Có task được phân công nhiều hơn 1 lần: {duplicates}")

    # Check missing tasks
    missing = expected_task_ids - set(assigned_task_ids)
    if missing:
        errors.append(f"Còn task chưa được phân công: {list(missing)}")

    # Check extraneous tasks
    extra = set(assigned_task_ids) - expected_task_ids
    if extra:
        errors.append(f"Có task không thuộc danh sách ban đầu: {list(extra)}")

    # Check valid owners and metadata
    has_unmatched_task = False
    for a in assignments:
        owner_id = str(a.get("owner_id", ""))
        if owner_id not in valid_member_ids:
            errors.append(f"Owner {owner_id} không thuộc thành viên trong nhóm.")
        if not a.get("reason"):
            errors.append(f"Task {a.get('task_id')} thiếu lý do phân công.")
        confidence = a.get("confidence")
        if not confidence:
            errors.append(f"Task {a.get('task_id')} thiếu mức độ confidence.")
        elif confidence in (Confidence.LOW, "low") or not a.get("matched_skills"):
            has_unmatched_task = True

    if has_unmatched_task:
        gaps.append("Có task chưa khớp skill; nhóm cần kiểm tra trước khi xác nhận.")

    return {
        "valid": len(errors) == 0,
        "errors": errors,
        "gaps": gaps,
    }


def save_assignment_draft(
    group_id: str | UUID,
    assignment_plan: dict[str, Any] | AssignmentPlan,
) -> AssignmentPlan:
    """Validate and save assignment draft. Status must strictly be pending_confirmation."""
    if isinstance(assignment_plan, dict):
        status = assignment_plan.get("status", "pending_confirmation")
        if status != "pending_confirmation":
            msg = (
                f"Chỉ được lưu bản nháp ở trạng thái pending_confirmation (nhận được '{status}'). "
                "Không được tự ý confirm."
            )
            raise ValueError(msg)
        plan = AssignmentPlan.model_validate(assignment_plan)
    else:
        if assignment_plan.status != "pending_confirmation":
            msg = (
                f"Chỉ được lưu bản nháp ở trạng thái pending_confirmation "
                f"(nhận được '{assignment_plan.status}'). Không được tự ý confirm."
            )
            raise ValueError(msg)
        plan = assignment_plan

    return plan

