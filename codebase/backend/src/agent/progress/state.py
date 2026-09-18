from typing import Any, TypedDict


class ProgressState(TypedDict, total=False):
    """Conversation-scoped state for progress and task explanation."""

    group_id: str
    user_id: str
    thread_id: str
    lab_id: str
    question: str
    task_id: str
    tasks: list[dict[str, Any]]
    documents: list[dict[str, Any]]
    assignment_plan: dict[str, Any]
    lab_manifest: dict[str, Any]
    checkpoints: list[dict[str, Any]]
    now_iso: str
    intent: str
    status: str
    response: dict[str, Any]
    references: list[str]
    task_ids: list[str]
    reference_ids: list[str]
    answer: str
    suggested_next_action: str | None
    scoped_tasks: list[dict[str, Any]]
    scoped_documents: list[dict[str, Any]]
    answer_context: dict[str, Any]
