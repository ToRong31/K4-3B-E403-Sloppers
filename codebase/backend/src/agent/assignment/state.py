from typing import Any, TypedDict


class AssignmentState(TypedDict, total=False):
    """Working state private to the assignment workflow."""

    group_name: str
    group_id: str
    checklist_id: str
    members: list[dict[str, Any]]
    tasks: list[dict[str, Any]]
    status: str
    candidate_scores: dict[str, Any]
    assignments: list[dict[str, Any]]
    gaps: list[str]
    questions: list[str]
    assignment_plan: dict[str, Any]

