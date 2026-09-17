import json
from pathlib import Path

from src.agent.graph import assignment_graph

DATASET_PATH = Path(__file__).parents[1] / "datasets" / "assignment_golden.jsonl"


def main() -> None:
    cases = [json.loads(line) for line in DATASET_PATH.read_text(encoding="utf-8").splitlines()]
    passed = 0
    for case in cases:
        result = assignment_graph.invoke(case["input"])
        is_pass = (
            result["status"] == case["expected_status"]
            and len(result["assignments"]) == case["expected_assignment_count"]
        )
        passed += is_pass
        print(f"{'PASS' if is_pass else 'FAIL'} | {case['id']}")
    print(f"\nResult: {passed}/{len(cases)} passed")


if __name__ == "__main__":
    main()
