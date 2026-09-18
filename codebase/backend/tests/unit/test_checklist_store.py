from pathlib import Path

import pytest

from src.infrastructure.checklist_store import ChecklistNotFoundError, ChecklistStore


def test_checklist_store_round_trip(tmp_path: Path) -> None:
    store = ChecklistStore(tmp_path)
    checklist = {
        "checklist_id": "checklist-1",
        "lab_id": "lab/unsafe path",
        "lab_version": 2,
        "status": "pending_review",
        "checkpoints": [],
    }

    saved_path = store.save(checklist)

    assert saved_path.parent == tmp_path
    assert saved_path.suffix == ".json"
    assert store.load("lab/unsafe path", 2) == checklist


def test_checklist_store_reports_missing_version(tmp_path: Path) -> None:
    store = ChecklistStore(tmp_path)

    with pytest.raises(ChecklistNotFoundError):
        store.load("lab-101", 3)
