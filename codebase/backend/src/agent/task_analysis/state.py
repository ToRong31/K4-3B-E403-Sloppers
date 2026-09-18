from typing import Any, TypedDict


class TaskAnalysisState(TypedDict, total=False):
    """Working state private to LAB decomposition."""

    lab_id: str
    lab_version: int
    lab_title: str
    lab_manifest: dict[str, Any]
    documents: list[dict[str, Any]]
    checkpoints: list[dict[str, Any]]
    items: list[dict[str, Any]]
    status: str
    gaps: list[str]
    questions: list[str]
    model: Any
    model_request: dict[str, Any]
    analyzed_tasks: list[dict[str, Any]]
    checklist_draft: dict[str, Any]
    error: str | None
    mode: str
    use_llm: bool
