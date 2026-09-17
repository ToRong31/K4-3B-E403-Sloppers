from typing import Any, TypedDict


class AssignmentState(TypedDict, total=False):
    """Serializable state passed between LangGraph nodes."""

    group_name: str
    members: list[dict[str, Any]]
    tasks: list[dict[str, Any]]
    status: str
    assignments: list[dict[str, Any]]
    gaps: list[str]
