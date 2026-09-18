from typing import Any, TypedDict


class TaskAnalysisState(TypedDict, total=False):
    """Working state private to LAB decomposition."""

    lab_id: str
    documents: list[dict[str, Any]]
    status: str
    gaps: list[str]
    model_request: dict[str, str]
    analyzed_tasks: list[dict[str, Any]]
