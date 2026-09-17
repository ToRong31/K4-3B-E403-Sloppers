from langchain_core.tools import tool


@tool
def skill_match_score(task_text: str, skills: list[str]) -> int:
    """Count self-declared skills that occur in a task description."""
    normalized_task = task_text.casefold()
    return sum(skill.casefold() in normalized_task for skill in skills if skill.strip())
