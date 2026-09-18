import re
from typing import Any
from uuid import uuid4

from src.models.lab import LabManifest
from src.models.tasks import ChecklistDraft, CheckpointChecklist, EffortSize, TaskDraft, TaskStatus

INJECTION_PATTERNS = [
    r"ignore\s+(all\s+)?(previous\s+)?instructions",
    r"bỏ\s+qua\s+(mọi\s+|toàn\s+bộ\s+)?(chỉ\s+dẫn|yêu\s+cầu|quy\s+tắc)",
    r"you\s+are\s+now",
    r"system\s+prompt",
    r"nộp\s+bài\s+trống",
    r"system:\s*override",
]


def detect_prompt_injection(text: str) -> bool:
    """Detect common prompt injection attempts in untrusted LAB content."""
    normalized = text.casefold()
    for pattern in INJECTION_PATTERNS:
        if re.search(pattern, normalized):
            return True
    return False


def load_and_sort_lab(manifest_data: dict[str, Any] | LabManifest) -> dict[str, Any]:
    """Parse and sort LAB checkpoints and items deterministically by their order fields."""
    if isinstance(manifest_data, LabManifest):
        manifest_dict = manifest_data.model_dump(mode="json")
    elif isinstance(manifest_data, dict):
        try:
            manifest = LabManifest.model_validate(manifest_data)
            manifest_dict = manifest.model_dump(mode="json")
        except Exception:
            manifest_dict = manifest_data
    else:
        raise ValueError("manifest_data must be a LabManifest instance or dict")

    # Sort checkpoints by checkpoint_order
    sorted_checkpoints = sorted(
        manifest_dict.get("checkpoints", []),
        key=lambda cp: cp.get("checkpoint_order", 0),
    )

    flat_items: list[dict[str, Any]] = []
    for cp in sorted_checkpoints:
        cp_id = cp.get("checkpoint_id")
        sorted_items = sorted(
            cp.get("items", []),
            key=lambda it: it.get("item_order", 0),
        )
        cp["items"] = sorted_items
        for item in sorted_items:
            item_with_cp = dict(item)
            item_with_cp["checkpoint_id"] = cp_id
            flat_items.append(item_with_cp)

    return {
        "lab_id": manifest_dict.get("lab_id", ""),
        "lab_version": manifest_dict.get("version", 1),
        "lab_title": manifest_dict.get("title", ""),
        "checkpoints": sorted_checkpoints,
        "items": flat_items,
    }


def validate_lab_sources(
    items: list[dict[str, Any]],
    expected_lab_id: str | None = None,
    expected_version: int | None = None,
) -> tuple[bool, list[str]]:
    """Verify that all items have valid non-empty content, valid ref_id, and no injection."""
    gaps: list[str] = []

    if not items:
        return False, ["Chưa có dữ liệu bài LAB hoặc danh sách item rỗng."]

    ref_id_pattern = re.compile(r"^lab://(?P<lab_id>[^/]+)/v(?P<version>\d+)/.+")

    for item in items:
        item_id = item.get("item_id", "unknown")
        content = str(item.get("content", "")).strip()
        ref_id = str(item.get("ref_id", "")).strip()

        if not content:
            gaps.append(f"Item '{item_id}' không có nội dung (content rỗng).")
            continue

        if detect_prompt_injection(content):
            gaps.append(f"Phát hiện dấu hiệu prompt injection trong nội dung item '{item_id}'.")

        if not ref_id:
            gaps.append(f"Item '{item_id}' thiếu ref_id bắt buộc.")
            continue

        match = ref_id_pattern.match(ref_id)
        if not match:
            gaps.append(
                f"ref_id '{ref_id}' của item '{item_id}' không đúng chuẩn URI "
                "(lab://<lab_id>/v<version>/...)."
            )
            continue

        ref_lab_id = match.group("lab_id")
        ref_version = int(match.group("version"))

        if expected_lab_id and not (
            ref_lab_id == expected_lab_id or expected_lab_id.startswith(ref_lab_id)
        ):
            gaps.append(
                f"ref_id '{ref_id}' thuộc lab_id '{ref_lab_id}', "
                f"không khớp với bài LAB '{expected_lab_id}'."
            )

        if expected_version is not None and ref_version != expected_version:
            gaps.append(
                f"ref_id '{ref_id}' thuộc phiên bản v{ref_version}, "
                f"không khớp với phiên bản LAB v{expected_version}."
            )

    return (len(gaps) == 0, gaps)


def validate_task_draft_items(
    tasks: list[dict[str, Any]],
    valid_ref_ids: set[str],
) -> tuple[bool, list[str]]:
    """Validate tasks against schema rules: known ref_ids and valid dependency keys."""
    gaps: list[str] = []

    if not tasks:
        return False, ["Danh sách task phân tích rỗng."]

    task_keys = {task.get("task_key") for task in tasks if task.get("task_key")}

    for task in tasks:
        key = task.get("task_key", "unknown")
        title = task.get("title", "").strip()
        deliverable = task.get("deliverable", "").strip()
        refs = task.get("reference_ids", [])
        deps = task.get("depends_on", [])

        if not title:
            gaps.append(f"Task '{key}' thiếu tiêu đề.")
        if not deliverable:
            gaps.append(f"Task '{key}' thiếu deliverable cụ thể.")

        if not refs:
            gaps.append(f"Task '{key}' không có reference_ids.")
        else:
            for ref in refs:
                if ref not in valid_ref_ids:
                    gaps.append(
                        f"Task '{key}' trỏ đến reference_id không tồn tại trong LAB: '{ref}'."
                    )

        for dep in deps:
            if dep not in task_keys:
                gaps.append(f"Task '{key}' phụ thuộc vào task_key không tồn tại: '{dep}'.")

    return (len(gaps) == 0, gaps)


def check_requirement_coverage(
    items: list[dict[str, Any]],
    tasks: list[dict[str, Any]],
) -> tuple[bool, list[str]]:
    """Ensure 100% of required items are covered by at least one task."""
    gaps: list[str] = []

    required_items = [item for item in items if item.get("is_required", True)]

    referenced_ids: set[str] = set()
    for task in tasks:
        for ref_id in task.get("reference_ids", []):
            referenced_ids.add(ref_id)

    uncovered = [item for item in required_items if item.get("ref_id") not in referenced_ids]

    for item in uncovered:
        gaps.append(
            f"Item bắt buộc '{item.get('item_id')}' (ref: {item.get('ref_id')}) "
            "chưa được task nào tham chiếu."
        )

    return (len(gaps) == 0, gaps)


def build_checklist_draft_object(
    lab_id: str,
    lab_version: int,
    tasks: list[dict[str, Any]],
    checkpoints: list[dict[str, Any]],
) -> dict[str, Any]:
    """Assemble validated tasks and checkpoints into a verified ChecklistDraft."""
    tasks_by_cp: dict[str, list[TaskDraft]] = {
        cp.get("checkpoint_id", ""): [] for cp in checkpoints
    }

    for task_dict in tasks:
        cp_id = task_dict.get("checkpoint_id", "")
        # Convert effort to EffortSize enum if needed
        effort = task_dict.get("estimated_effort", EffortSize.MEDIUM)
        if isinstance(effort, str):
            try:
                effort = EffortSize(effort.lower())
            except ValueError:
                effort = EffortSize.MEDIUM

        task_draft = TaskDraft(
            id=task_dict.get("id") or uuid4(),
            task_key=task_dict.get("task_key", f"task-{uuid4().hex[:6]}"),
            checkpoint_id=cp_id,
            task_order=task_dict.get("task_order", len(tasks_by_cp.get(cp_id, [])) + 1),
            title=task_dict.get("title", ""),
            description=task_dict.get("description", ""),
            deliverable=task_dict.get("deliverable", ""),
            completion_criteria=task_dict.get(
                "completion_criteria", ["Hoàn thành theo tiêu chuẩn bài Lab"]
            ),
            required_skills=task_dict.get("required_skills", []),
            estimated_effort=effort,
            depends_on=task_dict.get("depends_on", []),
            reference_ids=task_dict.get("reference_ids", []),
            status=TaskStatus.PROPOSED,
        )
        if cp_id in tasks_by_cp:
            tasks_by_cp[cp_id].append(task_draft)
        else:
            tasks_by_cp[cp_id] = [task_draft]

    checkpoint_checklists: list[CheckpointChecklist] = []
    for cp in checkpoints:
        cp_id = cp.get("checkpoint_id", "")
        cp_order = cp.get("checkpoint_order", 1)
        cp_tasks = tasks_by_cp.get(cp_id, [])
        checkpoint_checklists.append(
            CheckpointChecklist(
                checkpoint_id=cp_id,
                checkpoint_order=cp_order,
                tasks=cp_tasks,
            )
        )

    draft = ChecklistDraft(
        checklist_id=uuid4(),
        lab_id=lab_id,
        lab_version=lab_version,
        status="pending_review",
        checkpoints=checkpoint_checklists,
    )

    return draft.model_dump(mode="json")
