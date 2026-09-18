from typing import Any, TypedDict


class RouterState(TypedDict, total=False):
    """Minimal shared contract between the parent graph and its subgraphs."""

    operation: str
    user_id: str
    group_id: str
    lab_id: str
    thread_id: str
    group_name: str
    question: str
    task_id: str
    members: list[dict[str, Any]]
    tasks: list[dict[str, Any]]
    documents: list[dict[str, Any]]
    checkpoints: list[dict[str, Any]]
    lab_manifest: dict[str, Any]
    checklist_draft: dict[str, Any]
    now_iso: str
    status: str
    gaps: list[str]
    questions: list[str]
    mode: str
    model: Any
    assignments: list[dict[str, Any]]
    analyzed_tasks: list[dict[str, Any]]
    model_request: dict[str, Any]
    response: dict[str, Any]
    references: list[str]
