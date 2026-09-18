import pytest

from eval.scripts.run_eval import grade_case, load_cases
from src.agent.assignment.graph import assignment_graph


@pytest.mark.parametrize("case", load_cases(), ids=lambda case: case["id"])
def test_assignment_golden_case(case: dict) -> None:
    result = assignment_graph.invoke(case["input"])
    checks = grade_case(case, result)

    if not checks["passed"] and case.get("known_issue"):
        pytest.xfail(case["known_issue"])

    assert checks["passed"], {
        "failed_checks": [name for name, passed in checks.items() if not passed],
        "result": result,
    }
