import re
from datetime import UTC, datetime
from typing import Any

from langchain_core.tools import tool


def _tokens(text: str) -> set[str]:
    return {token for token in re.findall(r"\w+", text.casefold()) if len(token) > 1}


def _parse_datetime(value: str) -> datetime:
    parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    return parsed if parsed.tzinfo else parsed.replace(tzinfo=UTC)


@tool
def search_lab_context(
    query: str,
    documents: list[dict[str, Any]],
    top_k: int = 5,
) -> dict[str, Any]:
    """Search trusted LAB chunks and return relevant excerpts with stable references."""
    query_tokens = _tokens(query)
    ranked: list[tuple[int, dict[str, Any]]] = []
    for document in documents:
        content = str(document.get("content", ""))
        score = len(query_tokens & _tokens(content))
        if score:
            ranked.append((score, document))

    ranked.sort(key=lambda item: (-item[0], str(item[1].get("ref_id", ""))))
    matches = [
        {
            "ref_id": document.get("ref_id"),
            "source_type": document.get("source_type", "unknown"),
            "title": document.get("title", ""),
            "excerpt": str(document.get("content", ""))[:500],
            "score": score,
        }
        for score, document in ranked[: max(1, min(top_k, 10))]
    ]
    return {"query": query, "matches": matches, "found": bool(matches)}


@tool
def skill_match_score(task_text: str, skills: list[str]) -> int:
    """Count self-declared skills that occur in a task description."""
    normalized_task = task_text.casefold()
    return sum(skill.casefold() in normalized_task for skill in skills if skill.strip())


@tool
def get_task_context(
    task_id: str,
    tasks: list[dict[str, Any]],
    documents: list[dict[str, Any]],
) -> dict[str, Any]:
    """Get one task and only the LAB sources explicitly referenced by that task."""
    task = next((item for item in tasks if str(item.get("id")) == task_id), None)
    if task is None:
        return {"found": False, "task_id": task_id, "task": None, "references": []}

    reference_ids = {str(ref_id) for ref_id in task.get("reference_ids", [])}
    references = [
        {
            "ref_id": document.get("ref_id"),
            "title": document.get("title", ""),
            "content": document.get("content", ""),
        }
        for document in documents
        if str(document.get("ref_id")) in reference_ids
    ]
    return {"found": True, "task_id": task_id, "task": task, "references": references}


@tool
def summarize_team_progress(tasks: list[dict[str, Any]]) -> dict[str, Any]:
    """Calculate deterministic team progress from task statuses."""
    total = len(tasks)
    done = sum(task.get("status") == "done" for task in tasks)
    blocked = [task for task in tasks if task.get("status") == "blocked"]
    unassigned = [task for task in tasks if not task.get("owner_id")]
    return {
        "total": total,
        "done": done,
        "remaining": total - done,
        "progress_percent": round(done / total * 100) if total else 0,
        "blocked_task_ids": [str(task.get("id")) for task in blocked],
        "unassigned_task_ids": [str(task.get("id")) for task in unassigned],
    }


@tool
def detect_checkpoint_risks(
    checkpoints: list[dict[str, Any]],
    tasks: list[dict[str, Any]],
    now_iso: str,
    warning_hours: int = 6,
) -> dict[str, Any]:
    """Detect late or near-due checkpoints using rules; this tool does not call AI."""
    now = _parse_datetime(now_iso)
    task_by_id = {str(task.get("id")): task for task in tasks}
    alerts = []

    for checkpoint in checkpoints:
        due_at = _parse_datetime(str(checkpoint["due_at"]))
        required_ids = [str(task_id) for task_id in checkpoint.get("required_task_ids", [])]
        incomplete_ids = [
            task_id
            for task_id in required_ids
            if task_by_id.get(task_id, {}).get("status") != "done"
        ]
        if not incomplete_ids:
            continue

        hours_remaining = (due_at - now).total_seconds() / 3600
        if hours_remaining < 0:
            severity = "critical"
            reason = "checkpoint_overdue"
        elif hours_remaining <= warning_hours:
            severity = "warning"
            reason = "checkpoint_at_risk"
        else:
            continue

        alerts.append(
            {
                "checkpoint_id": str(checkpoint.get("id")),
                "checkpoint_title": checkpoint.get("title", ""),
                "severity": severity,
                "reason": reason,
                "hours_remaining": round(hours_remaining, 1),
                "incomplete_task_ids": incomplete_ids,
            }
        )

    return {"has_risk": bool(alerts), "alerts": alerts}
