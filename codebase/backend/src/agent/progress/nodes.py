"""Nodes for the private, read-only progress and task-explanation graph."""

from __future__ import annotations

from typing import Any

from src.agent.progress.state import ProgressState
from src.agent.progress.tools import (
    get_my_tasks,
    get_task_context,
    summarize_team_progress,
)


def _text(value: Any) -> str:
    return str(value or "").strip()


def _flatten_lab_manifest(manifest: dict[str, Any], lab_id: str) -> list[dict[str, Any]]:
    if _text(manifest.get("lab_id")) != lab_id:
        return []

    documents: list[dict[str, Any]] = []
    for checkpoint in manifest.get("checkpoints", []):
        for item in checkpoint.get("items", []):
            documents.append(
                {
                    **item,
                    "lab_id": lab_id,
                    "checkpoint_id": checkpoint.get("checkpoint_id"),
                    "checkpoint_order": checkpoint.get("checkpoint_order"),
                }
            )
    return documents


def _hydrate_tasks(state: ProgressState) -> list[dict[str, Any]]:
    """Attach draft metadata only when the assignment plan belongs to this group."""

    group_id = _text(state.get("group_id"))
    plan = state.get("assignment_plan") or {}
    plan_group_id = _text(plan.get("group_id"))
    owner_by_task = {
        _text(item.get("task_id")): _text(item.get("owner_id"))
        for item in plan.get("assignments", [])
        if _text(item.get("task_id")) and _text(item.get("owner_id"))
    }

    hydrated: list[dict[str, Any]] = []
    for source in state.get("tasks", []):
        task = dict(source)
        if not _text(task.get("group_id")) and plan_group_id == group_id:
            task["group_id"] = group_id
        if not _text(task.get("owner_id")):
            task["owner_id"] = owner_by_task.get(_text(task.get("id")), "")
        hydrated.append(task)
    return hydrated


def authorize_scope(state: ProgressState) -> ProgressState:
    """Require private-chat scope keys and read a fresh, safely scoped snapshot."""

    required = ("user_id", "group_id", "lab_id", "thread_id")
    missing = [field for field in required if not _text(state.get(field))]
    if missing:
        return {
            "answer_context": {
                "type": "clarification",
                "message": "Thiếu ngữ cảnh chat riêng để kiểm tra task an toàn.",
                "next_action": "Hãy mở lại LabSpace từ tài khoản của bạn.",
            }
        }

    documents = _flatten_lab_manifest(state.get("lab_manifest") or {}, state["lab_id"])
    if not documents:
        documents = [
            document
            for document in state.get("documents", [])
            if not _text(document.get("lab_id"))
            or _text(document.get("lab_id")) == state["lab_id"]
        ]
    return {
        "scoped_tasks": _hydrate_tasks(state),
        "scoped_documents": documents,
    }


def classify_intent(state: ProgressState) -> ProgressState:
    if state.get("answer_context", {}).get("type") == "clarification":
        return {"intent": "clarify"}

    question = _text(state.get("question")).casefold()
    if any(
        term in question
        for term in (
            "tôi cần làm gì",
            "tôi đang có task",
            "việc của tôi",
            "task của tôi",
            "task gì",
            "tôi được giao",
            "phần của tôi",
        )
    ):
        return {"intent": "my_tasks"}
    if any(
        term in question
        for term in ("tiến độ", "nhóm còn", "bao nhiêu việc", "còn lại", "hoàn thành")
    ):
        return {"intent": "progress"}
    if state.get("task_id") or any(
        term in question
        for term in (
            "task này",
            "việc này",
            "giải thích",
            "làm như thế nào",
            "làm thế nào",
            "phần ",
        )
    ):
        return {"intent": "explain"}
    return {"intent": "clarify"}


def route_intent(state: ProgressState) -> str:
    return state["intent"]


def load_my_tasks(state: ProgressState) -> ProgressState:
    tasks = get_my_tasks(
        state["user_id"], state["group_id"], state.get("scoped_tasks", [])
    )
    return {"answer_context": {"type": "my_tasks", "tasks": tasks}}


def summarize_progress(state: ProgressState) -> ProgressState:
    summary = summarize_team_progress(state["group_id"], state.get("scoped_tasks", []))
    return {"answer_context": {"type": "progress", "summary": summary}}


def _task_id_from_question(state: ProgressState) -> str:
    question = _text(state.get("question")).casefold()
    matching_tasks = [
        task
        for task in get_my_tasks(
            state["user_id"], state["group_id"], state.get("scoped_tasks", [])
        )
        if any(
            token in _text(task.get("title")).casefold()
            for token in question.split()
            if len(token) > 2
        )
    ]
    if matching_tasks:
        return _text(matching_tasks[0].get("id"))
    return _text(state.get("task_id"))


def explain_task(state: ProgressState) -> ProgressState:
    task_id = _task_id_from_question(state)
    context = get_task_context(
        state["group_id"],
        state["user_id"],
        task_id,
        state.get("scoped_tasks", []),
        state.get("scoped_documents", []),
    )
    return {
        "task_id": task_id,
        "answer_context": {"type": "task_context", "context": context},
    }


def request_clarification(_: ProgressState) -> ProgressState:
    return {
        "answer_context": {
            "type": "clarification",
            "message": "Bạn muốn xem việc của mình, tiến độ nhóm, hay giải thích task nào?",
            "next_action": "Hãy nêu tên task hoặc chọn một task trong LabSpace.",
        }
    }


def _task_label(task: dict[str, Any]) -> str:
    return _text(task.get("title")) or "Task chưa có tên"


def build_grounded_answer(state: ProgressState) -> ProgressState:
    """Turn deterministic, authorized results into the public chat contract."""

    context = state.get("answer_context", {})
    kind = context.get("type")
    status = "ready"
    task_ids: list[str] = []
    references: list[str] = []
    next_action: str | None = None
    data: dict[str, Any] = {}

    if kind == "my_tasks":
        tasks = context["tasks"]
        task_ids = [_text(task.get("id")) for task in tasks]
        if not tasks:
            answer = "Hiện bạn chưa có task nào được giao trong nhóm này."
            next_action = "Chờ nhóm trưởng phê duyệt kế hoạch hoặc kiểm tra lại phân công."
        else:
            task_lines = [
                f"- {_task_label(task)} ({_text(task.get('status')) or 'todo'})"
                for task in tasks
            ]
            answer = "Việc của bạn:\n" + "\n".join(task_lines)
            next_action = "Chọn một task nếu bạn cần xem chi tiết yêu cầu."
        data = {"tasks": tasks}
    elif kind == "progress":
        summary = context["summary"]
        answer = (
            f"Nhóm đã xong {summary['done_tasks']}/{summary['total_tasks']} việc "
            f"({summary['progress_percent']}%), còn {summary['remaining_tasks']} việc."
        )
        if summary["blocked_tasks"]:
            answer += f" Có {summary['blocked_tasks']} việc đang bị chặn."
            next_action = "Mở task bị chặn trong board để cập nhật lý do hoặc nhờ hỗ trợ."
        else:
            next_action = "Tiếp tục cập nhật trạng thái task khi có thay đổi."
        data = summary
    elif kind == "task_context":
        task_context = context["context"]
        task = task_context["task"]
        if not task_context["found"]:
            status = "clarify"
            answer = "Mình chỉ có thể giải thích task được giao cho bạn trong nhóm hiện tại."
            next_action = "Hãy chọn một task của bạn trong LabSpace."
        else:
            task_ids = [_text(task.get("id"))]
            references = [_text(item.get("ref_id")) for item in task_context["references"]]
            if not references:
                status = "clarify"
                answer = "Chưa đủ dữ liệu từ bài LAB để giải thích task này an toàn."
                next_action = "Hãy đồng bộ lại nội dung bài LAB hoặc hỏi nhóm trưởng."
            else:
                criteria = "; ".join(task.get("completion_criteria", [])) or "chưa có"
                dependencies = ", ".join(task.get("depends_on", [])) or "không có"
                answer = (
                    f"{_task_label(task)}: đầu ra cần nộp là `{_text(task.get('deliverable'))}`. "
                    f"Hoàn thành khi: {criteria}. Phụ thuộc: {dependencies}."
                )
                next_action = "Làm theo tiêu chí hoàn thành và cập nhật task khi bạn có tiến độ."
        data = task_context
    else:
        status = "clarify"
        answer = context.get("message", "Bạn muốn hỏi gì về task hoặc tiến độ?")
        next_action = context.get("next_action")

    response = {
        "status": status,
        "answer": answer,
        "task_ids": task_ids,
        "reference_ids": references,
        "suggested_next_action": next_action,
        # Diagnostic data keeps the existing graph consumer working; the five
        # fields above are the stable chat response contract.
        "data": data,
    }
    return {
        "status": status,
        "answer": answer,
        "task_ids": task_ids,
        "reference_ids": references,
        "suggested_next_action": next_action,
        "references": references,
        "response": response,
    }
