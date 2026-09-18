import json
import logging
from typing import Any

from langchain_core.messages import HumanMessage, SystemMessage

from src.agent.assignment.state import AssignmentState
from src.agent.prompts import ASSIGNMENT_SYSTEM_PROMPT, build_assignment_prompt
from src.agent.tools import skill_match_score
from src.infrastructure.llm.factory import build_chat_model
from src.models.schemas import AssignmentConfidence, AssignmentDraftResponse, DraftStatus

logger = logging.getLogger(__name__)


def _matched_skills(task_text: str, skills: list[str]) -> list[str]:
    """Return only the self-declared skills explicitly present in the task."""
    normalized_task = task_text.casefold()
    return [skill for skill in skills if skill.strip() and skill.casefold() in normalized_task]


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


def _validate_llm_draft(
    draft: AssignmentDraftResponse,
    state: AssignmentState,
) -> tuple[AssignmentState | None, str | None]:
    """Accept only a complete, grounded proposal from the model."""
    if draft.status == DraftStatus.CLARIFY:
        return (
            {
                "status": DraftStatus.CLARIFY,
                "assignments": [],
                "gaps": draft.gaps or ["Model cần thêm dữ liệu để phân công."],
            },
            None,
        )

    task_ids = [str(task["id"]) for task in state["tasks"]]
    member_by_id = {str(member["id"]): member for member in state["members"]}
    draft_task_ids = [str(item.task_id) for item in draft.assignments]
    if len(draft_task_ids) != len(task_ids) or set(draft_task_ids) != set(task_ids):
        return None, (
            "task_coverage_mismatch "
            f"expected={task_ids!r} received={draft_task_ids!r}"
        )

    normalized_assignments = []
    for assignment in draft.assignments:
        owner = member_by_id.get(str(assignment.owner_id))
        if owner is None:
            return None, (
                f"unknown_owner task_id={assignment.task_id!s} "
                f"owner_id={assignment.owner_id!s}"
            )

        # The source of truth is the member's self-declared skill list.  Do not
        # require the literal skill label to occur in the task text: valid
        # semantic matches such as Backend -> FastAPI and Testing -> kiểm thử
        # would otherwise always be rejected.
        declared_skills = {
            skill.strip().casefold(): skill.strip()
            for skill in owner["skills"]
            if skill.strip()
        }
        returned_skill_keys = list(
            dict.fromkeys(
                skill.strip().casefold()
                for skill in assignment.matched_skills
                if skill.strip()
            )
        )
        unknown_skills = set(returned_skill_keys) - declared_skills.keys()
        if unknown_skills:
            return None, (
                f"undeclared_skills task_id={assignment.task_id!s} "
                f"owner_id={assignment.owner_id!s} "
                f"skills={sorted(unknown_skills)!r}"
            )
        if not assignment.matched_skills and assignment.confidence != AssignmentConfidence.LOW:
            return None, (
                f"unmatched_assignment_not_low_confidence task_id={assignment.task_id!s} "
                f"confidence={assignment.confidence.value}"
            )

        item = assignment.model_dump(mode="json")
        item["matched_skills"] = [
            declared_skills[key] for key in returned_skill_keys
        ]
        normalized_assignments.append(item)

    return (
        {
            "status": DraftStatus.READY,
            "assignments": normalized_assignments,
            "gaps": draft.gaps,
        },
        None,
    )


def _json_for_log(value: Any) -> str:
    """Serialize LangChain/Pydantic response objects without leaking API keys."""
    if hasattr(value, "model_dump"):
        value = value.model_dump(mode="json")
    return json.dumps(value, ensure_ascii=False, default=str)


def _assign_tasks_with_llm(state: AssignmentState) -> AssignmentState:
    """Ask the configured provider for a draft, then validate it against source data."""
    try:
        model = state.get("model") or build_chat_model()
        user_prompt = build_assignment_prompt(
            {
                "group_name": state["group_name"],
                "members": state["members"],
                "tasks": state["tasks"],
            }
        )
        messages = [
            SystemMessage(content=ASSIGNMENT_SYSTEM_PROMPT),
            HumanMessage(content=user_prompt),
        ]
        logger.info(
            "Assignment LLM prompt | system=%s | user=%s",
            ASSIGNMENT_SYSTEM_PROMPT,
            user_prompt,
        )

        # include_raw keeps the provider response available for CP3 traceability.
        # The TypeError fallback keeps simple test doubles and older adapters usable.
        try:
            structured_model = model.with_structured_output(
                AssignmentDraftResponse, include_raw=True
            )
        except TypeError:
            structured_model = model.with_structured_output(AssignmentDraftResponse)
        response = structured_model.invoke(messages)

        if isinstance(response, dict) and "parsed" in response:
            logger.info("Assignment LLM raw response | %s", _json_for_log(response.get("raw")))
            if response.get("parsing_error") is not None:
                raise ValueError(f"Structured output parsing failed: {response['parsing_error']}")
            response = response.get("parsed")

        draft = (
            response
            if isinstance(response, AssignmentDraftResponse)
            else AssignmentDraftResponse.model_validate(response)
        )
        logger.info("Assignment LLM parsed draft | %s", draft.model_dump_json())
    except Exception:
        logger.exception("Assignment LLM invocation failed")
        return {
            "status": DraftStatus.CLARIFY,
            "assignments": [],
            "gaps": ["Không thể tạo bản nháp từ AI lúc này. Vui lòng thử lại."],
        }

    validated, rejection_reason = _validate_llm_draft(draft, state)
    if validated is None:
        logger.warning(
            "Assignment LLM returned an invalid or ungrounded draft | reason=%s | draft=%s",
            rejection_reason,
            draft.model_dump_json(),
        )
        return {
            "status": DraftStatus.CLARIFY,
            "assignments": [],
            "gaps": [
                "Bản nháp AI không hợp lệ với checklist hoặc kỹ năng tự khai. Vui lòng tạo lại."
            ],
        }
    return validated


def assign_tasks(state: AssignmentState) -> AssignmentState:
    if state.get("use_llm"):
        return _assign_tasks_with_llm(state)

    # Deterministic mode is retained solely for unit tests and offline tooling.
    members = [member for member in state["members"] if member.get("skills")]
    workload = {member["id"]: 0 for member in members}
    assignments = []
    has_unmatched_task = False

    for task in state["tasks"]:
        task_text = f"{task['title']} {task['deliverable']}"
        candidates = []
        for member in members:
            matched_skills = _matched_skills(task_text, member["skills"])
            score = skill_match_score.invoke({"task_text": task_text, "skills": member["skills"]})
            candidates.append((score, -workload[member["id"]], member, matched_skills))

        score, _, owner, matched_skills = max(candidates, key=lambda item: (item[0], item[1]))
        workload[owner["id"]] += 1
        has_unmatched_task = has_unmatched_task or score == 0
        if matched_skills:
            reason = f"Kỹ năng tự khai khớp trực tiếp: {', '.join(matched_skills)}."
            confidence = AssignmentConfidence.HIGH
        else:
            reason = "Chưa có skill khớp trực tiếp; tạm cân bằng số task trong nhóm."
            confidence = AssignmentConfidence.LOW
        assignments.append(
            {
                "task_id": task["id"],
                "owner_id": owner["id"],
                "matched_skills": matched_skills,
                "reason": reason,
                "confidence": confidence,
            }
        )

    gaps = []
    if has_unmatched_task:
        gaps.append("Có task chưa khớp skill; nhóm cần kiểm tra trước khi xác nhận.")
    return {
        "status": DraftStatus.READY,
        "assignments": assignments,
        "gaps": gaps,
    }
