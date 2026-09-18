from src.agent.assignment.state import AssignmentState
from src.agent.tools import skill_match_score
from src.models.schemas import DraftStatus


def validate_input(state: AssignmentState) -> AssignmentState:
    members_with_skills = [member for member in state["members"] if member.get("skills")]
    if not members_with_skills:
        return {
            "status": DraftStatus.CLARIFY,
            "assignments": [],
            "gaps": ["Ít nhất một thành viên cần khai báo kỹ năng trước khi phân công."],
        }
    return {"status": DraftStatus.READY, "gaps": []}


def route_after_validation(state: AssignmentState) -> str:
    return "clarify" if state["status"] == DraftStatus.CLARIFY else "assign"


def request_clarification(state: AssignmentState) -> AssignmentState:
    return {
        "status": DraftStatus.CLARIFY,
        "assignments": [],
        "gaps": state.get("gaps", []),
    }


def assign_tasks(state: AssignmentState) -> AssignmentState:
    members = [member for member in state["members"] if member.get("skills")]
    workload = {member["id"]: 0 for member in members}
    assignments = []
    has_unmatched_task = False

    for task in state["tasks"]:
        task_text = f"{task['title']} {task['deliverable']}"
        candidates = []
        for member in members:
            score = skill_match_score.invoke({"task_text": task_text, "skills": member["skills"]})
            candidates.append((score, -workload[member["id"]], member))

        score, _, owner = max(candidates, key=lambda item: (item[0], item[1]))
        workload[owner["id"]] += 1
        has_unmatched_task = has_unmatched_task or score == 0
        reason = (
            "Kỹ năng tự khai khớp nội dung task."
            if score
            else "Chưa có skill khớp trực tiếp; tạm cân bằng số task trong nhóm."
        )
        assignments.append({"task_id": task["id"], "owner_id": owner["id"], "reason": reason})

    gaps = []
    if has_unmatched_task:
        gaps.append("Có task chưa khớp skill; nhóm cần kiểm tra trước khi xác nhận.")
    return {
        "status": DraftStatus.READY,
        "assignments": assignments,
        "gaps": gaps,
    }
