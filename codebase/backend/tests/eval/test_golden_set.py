import json
from pathlib import Path

import pytest

from src.agent.graph import assignment_graph

DATASET_PATH = Path(__file__).parents[2] / "eval" / "datasets" / "assignment_golden.jsonl"


def load_cases() -> list[dict]:
    return [json.loads(line) for line in DATASET_PATH.read_text(encoding="utf-8").splitlines()]


@pytest.mark.parametrize("case", load_cases(), ids=lambda case: case["id"])
def test_assignment_golden_case(case: dict) -> None:
    result = assignment_graph.invoke(case["input"])

    assert result["status"] == case["expected_status"]
    assert len(result["assignments"]) == case["expected_assignment_count"]
