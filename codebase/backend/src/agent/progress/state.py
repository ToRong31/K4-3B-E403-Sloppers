from typing import Any, TypedDict


class ProgressState(TypedDict, total=False):
    """Conversation-scoped state for progress and task explanation."""

    group_id: str
    user_id: str
    thread_id: str
    question: str
    task_id: str
    tasks: list[dict[str, Any]]
    documents: list[dict[str, Any]]
    checkpoints: list[dict[str, Any]]
    now_iso: str
    intent: str
    status: str
    response: dict[str, Any]
    references: list[str]
