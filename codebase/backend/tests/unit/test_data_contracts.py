import json
from pathlib import Path

import pytest
from pydantic import BaseModel

from src.models.alerts import CoachAlert
from src.models.assignments import AssignmentPlan
from src.models.chat import PrivateChatContext
from src.models.groups import GroupSnapshot
from src.models.lab import LabManifest
from src.models.tasks import ChecklistDraft

FIXTURE_DIR = Path(__file__).parents[2] / "examples_data" / "fixtures"

CONTRACTS: list[tuple[str, type[BaseModel]]] = [
    ("lab_manifest.json", LabManifest),
    ("group_snapshot.json", GroupSnapshot),
    ("checklist_draft.json", ChecklistDraft),
    ("assignment_plan.json", AssignmentPlan),
    ("private_chat_context.json", PrivateChatContext),
    ("coach_alert.json", CoachAlert),
]


@pytest.mark.parametrize(("filename", "model"), CONTRACTS)
def test_example_fixture_matches_contract(filename: str, model: type[BaseModel]) -> None:
    payload = json.loads((FIXTURE_DIR / filename).read_text(encoding="utf-8"))

    parsed = model.model_validate(payload)

    assert parsed is not None


def test_lab_items_have_stable_order_and_references() -> None:
    payload = json.loads((FIXTURE_DIR / "lab_manifest.json").read_text(encoding="utf-8"))
    lab = LabManifest.model_validate(payload)

    assert [checkpoint.checkpoint_order for checkpoint in lab.checkpoints] == [1, 2, 3, 4, 5, 6, 7]
    assert all(item.ref_id.startswith("lab://") for cp in lab.checkpoints for item in cp.items)


def test_checklist_tasks_reference_the_same_lab_version() -> None:
    payload = json.loads((FIXTURE_DIR / "checklist_draft.json").read_text(encoding="utf-8"))
    checklist = ChecklistDraft.model_validate(payload)

    expected_prefix = f"lab://K4-L3B-DAY05-06/v{checklist.lab_version}/"
    assert all(
        reference.startswith(expected_prefix)
        for checkpoint in checklist.checkpoints
        for task in checkpoint.tasks
        for reference in task.reference_ids
    )
