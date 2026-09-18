from src.agent.assignment.nodes import assign_tasks, validate_input
from src.models.schemas import DraftStatus


def test_validate_input_returns_clarify_without_skills() -> None:
    result = validate_input({"members": [{"id": "1", "name": "An", "skills": []}]})

    assert result["status"] == DraftStatus.CLARIFY
    assert result["gaps"]


def test_assign_tasks_prefers_matching_skill() -> None:
    result = assign_tasks(
        {
            "members": [
                {"id": "researcher", "name": "Trang", "skills": ["Research"]},
                {"id": "ai", "name": "Dương", "skills": ["AI"]},
            ],
            "tasks": [{"id": "task-1", "title": "AI evaluation", "deliverable": "golden set"}],
        }
    )

    assert result["assignments"][0]["owner_id"] == "ai"
