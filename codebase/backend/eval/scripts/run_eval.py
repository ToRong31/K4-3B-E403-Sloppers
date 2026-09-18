import json
from collections import Counter
from csv import DictWriter
from pathlib import Path

from src.agent.assignment.graph import assignment_graph

REPOSITORY_ROOT = Path(__file__).parents[4]
DATASET_PATH = REPOSITORY_ROOT / "eval" / "golden-set-assignment.json"
RESULTS_PATH = REPOSITORY_ROOT / "eval" / "results" / "assignment-run-1.csv"


def load_cases() -> list[dict]:
    return json.loads(DATASET_PATH.read_text(encoding="utf-8"))["cases"]


def grade_case(case: dict, result: dict) -> dict[str, bool]:
    expected = case["expected"]
    assignments = result.get("assignments", [])
    assignments_by_task = {str(item["task_id"]): item for item in assignments}

    owners_valid = all(
        task_id in assignments_by_task
        and str(assignments_by_task[task_id]["owner_id"]) in owner_ids
        for task_id, owner_ids in expected.get("acceptable_owners", {}).items()
    )

    gaps_text = " ".join(result.get("gaps", [])).casefold()
    gaps_valid = all(
        substring.casefold() in gaps_text
        for substring in expected.get("required_gap_substrings", [])
    )

    reasons_valid = all(
        task_id in assignments_by_task
        and all(
            substring.casefold() in assignments_by_task[task_id].get("reason", "").casefold()
            for substring in substrings
        )
        for task_id, substrings in expected.get("required_reason_substrings", {}).items()
    )

    load = Counter(str(item["owner_id"]) for item in assignments)
    eligible_member_ids = [
        str(member["id"]) for member in case["input"]["members"] if member.get("skills")
    ]
    load_values = [load[member_id] for member_id in eligible_member_ids]
    load_delta = max(load_values) - min(load_values) if load_values else 0
    member_ids = {str(member["id"]) for member in case["input"]["members"]}
    owners_exist = all(str(item["owner_id"]) in member_ids for item in assignments)
    authority_valid = all(
        field not in result for field in expected.get("forbidden_response_fields", [])
    )

    checks = {
        "status": result.get("status") == expected["status"],
        "assignment_count": len(assignments) == expected["assignment_count"],
        "owners": owners_valid,
        "gaps": gaps_valid,
        "reasons": reasons_valid,
        "workload_balance": load_delta <= expected["max_load_delta"],
        "owners_exist": owners_exist,
        "authority_boundary": authority_valid,
    }
    return {**checks, "passed": all(checks.values())}


def main() -> None:
    cases = load_cases()
    rows = []
    for case in cases:
        result = assignment_graph.invoke(case["input"])
        checks = grade_case(case, result)
        failed_checks = [name for name, value in checks.items() if name != "passed" and not value]
        rows.append(
            {
                "case_id": case["id"],
                "passed": checks["passed"],
                "failed_checks": ",".join(failed_checks),
                "actual_status": result.get("status", "missing"),
                "assignment_count": len(result.get("assignments", [])),
            }
        )
        print(f"{'PASS' if checks['passed'] else 'FAIL'} | {case['id']}")

    RESULTS_PATH.parent.mkdir(parents=True, exist_ok=True)
    with RESULTS_PATH.open("w", newline="", encoding="utf-8-sig") as file:
        writer = DictWriter(file, fieldnames=rows[0].keys())
        writer.writeheader()
        writer.writerows(rows)

    passed = sum(row["passed"] for row in rows)
    print(f"\nResult: {passed}/{len(cases)} passed")


if __name__ == "__main__":
    main()
