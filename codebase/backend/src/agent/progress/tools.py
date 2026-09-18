"""Read-only, scope-aware tools used by the private Progress Assistant.

The production repository should query these records after authorization. The
helpers still enforce their scope here so fixture data containing many groups
cannot leak a task to an unintended member.
"""

from __future__ import annotations

from collections import Counter
from typing import Any


def _text(value: Any) -> str:
    return str(value or "").strip()


def _sort_key(task: dict[str, Any]) -> tuple[int, int, str]:
    return (
        int(task.get("checkpoint_order") or 999_999),
        int(task.get("task_order") or 999_999),
        _text(task.get("id")),
    )


def get_my_tasks(
    user_id: str,
    group_id: str,
    tasks: list[dict[str, Any]],
    statuses: list[str] | None = None,
) -> list[dict[str, Any]]:
    """Return only one member's tasks in a group, in canonical task order."""

    wanted_statuses = {status.casefold() for status in statuses or []}
    results = [
        task
        for task in tasks
        if _text(task.get("group_id")) == _text(group_id)
        and _text(task.get("owner_id")) == _text(user_id)
        and (
            not wanted_statuses
            or _text(task.get("status")).casefold() in wanted_statuses
        )
    ]
    return sorted(results, key=_sort_key)


def get_task_context(
    group_id: str,
    user_id: str,
    task_id: str,
    tasks: list[dict[str, Any]],
    documents: list[dict[str, Any]],
) -> dict[str, Any]:
    """Return one owned task and only its explicit LAB references."""

    task = next(
        (
            candidate
            for candidate in tasks
            if _text(candidate.get("id")) == _text(task_id)
            and _text(candidate.get("group_id")) == _text(group_id)
            and _text(candidate.get("owner_id")) == _text(user_id)
        ),
        None,
    )
    if task is None:
        return {"found": False, "task": None, "references": []}

    reference_ids = {_text(reference) for reference in task.get("reference_ids", [])}
    references = [
        document
        for document in documents
        if _text(document.get("ref_id")) in reference_ids
    ]
    return {"found": True, "task": task, "references": references}


def summarize_team_progress(group_id: str, tasks: list[dict[str, Any]]) -> dict[str, Any]:
    """Calculate aggregate group progress without exposing another owner's tasks."""

    scoped_tasks = [task for task in tasks if _text(task.get("group_id")) == _text(group_id)]
    counts = Counter(_text(task.get("status")).casefold() or "todo" for task in scoped_tasks)
    total = len(scoped_tasks)
    done = counts["done"]
    blocked = counts["blocked"]
    unassigned = sum(1 for task in scoped_tasks if not _text(task.get("owner_id")))
    return {
        "total_tasks": total,
        "done_tasks": done,
        "remaining_tasks": max(total - done, 0),
        "blocked_tasks": blocked,
        "unassigned_tasks": unassigned,
        "progress_percent": round((done / total) * 100) if total else 0,
    }


def search_lab_context(
    lab_id: str,
    query: str,
    documents: list[dict[str, Any]],
    checkpoint_id: str | None = None,
) -> list[dict[str, Any]]:
    """Search already-authorized LAB chunks and preserve their real ``ref_id``."""

    query_tokens = {token for token in query.casefold().split() if len(token) > 1}
    matches: list[dict[str, Any]] = []
    for document in documents:
        document_lab_id = _text(document.get("lab_id"))
        if document_lab_id and document_lab_id != _text(lab_id):
            continue
        if checkpoint_id and _text(document.get("checkpoint_id")) != checkpoint_id:
            continue
        haystack = " ".join(
            _text(document.get(field)) for field in ("title", "content", "ref_id")
        ).casefold()
        if not query_tokens or any(token in haystack for token in query_tokens):
            matches.append(document)
    return matches
