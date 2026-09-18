import csv
import json
import os
import time
from collections import Counter
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

ROOT = Path(__file__).parents[1]
DATASET = ROOT / "golden-set-assignment.json"
RESULTS = ROOT / "results" / "assignment-live-run-1.csv"
RAW_LOG = ROOT / "results" / "assignment-live-run-1-raw.jsonl"


def grade(case: dict, response: dict) -> dict[str, bool | int]:
    expected = case["expected"]
    assignments = response.get("assignments", [])
    assignments_by_task = {str(item["task_id"]): item for item in assignments}

    owners_valid = all(
        task_id in assignments_by_task
        and str(assignments_by_task[task_id]["owner_id"]) in owner_ids
        for task_id, owner_ids in expected.get("acceptable_owners", {}).items()
    )
    gaps_text = " ".join(response.get("gaps", [])).casefold()
    gaps_valid = all(
        substring.casefold() in gaps_text
        for substring in expected.get("required_gap_substrings", [])
    )
    reasons_valid = all(
        task_id in assignments_by_task
        and all(
            substring.casefold()
            in assignments_by_task[task_id].get("reason", "").casefold()
            for substring in substrings
        )
        for task_id, substrings in expected.get(
            "required_reason_substrings", {}
        ).items()
    )

    load = Counter(str(item["owner_id"]) for item in assignments)
    eligible_member_ids = [
        str(member["id"])
        for member in case["input"]["members"]
        if any(skill.strip() for skill in member.get("skills", []))
    ]
    load_values = [load[member_id] for member_id in eligible_member_ids]
    load_delta = max(load_values) - min(load_values) if load_values else 0
    member_ids = {str(member["id"]) for member in case["input"]["members"]}

    checks = {
        "status": response.get("status") == expected["status"],
        "assignment_count": len(assignments) == expected["assignment_count"],
        "owners": owners_valid,
        "gaps": gaps_valid,
        "reasons": reasons_valid,
        "workload_balance": load_delta <= expected["max_load_delta"],
        "owners_exist": all(
            str(item["owner_id"]) in member_ids for item in assignments
        ),
        "authority_boundary": all(
            field not in response
            for field in expected.get("forbidden_response_fields", [])
        ),
    }
    return {
        **checks,
        "passed": all(checks.values()),
        "assignment_count_actual": len(assignments),
    }


def call_target(url: str, payload: dict) -> tuple[dict, int]:
    request = Request(
        url,
        data=json.dumps(payload, ensure_ascii=False).encode("utf-8"),
        headers={"Content-Type": "application/json; charset=utf-8"},
        method="POST",
    )
    started = time.perf_counter()
    with urlopen(request, timeout=120) as response:
        body = json.loads(response.read().decode("utf-8"))
    return body, round((time.perf_counter() - started) * 1000)


def classify_error(exc: Exception) -> str:
    if isinstance(exc, HTTPError):
        if exc.code in {401, 403}:
            return "authentication_error"
        if exc.code == 429:
            return "rate_limit_error"
        return "target_http_error"
    if isinstance(exc, (URLError, ConnectionError)):
        return "connection_error"
    return "runner_error"


def run_assignment_eval() -> None:
    target_url = os.environ.get(
        "EVAL_ASSIGNMENT_TARGET_URL",
        "http://127.0.0.1:8000/api/v1/assignments/assign_tasks",
    )
    cases = json.loads(DATASET.read_text(encoding="utf-8"))["cases"]
    rows = []
    raw_lines = []

    for case in cases:
        try:
            response, latency_ms = call_target(target_url, case["input"])
            result = grade(case, response)
            error = ""
            error_category = ""
        except (
            HTTPError,
            URLError,
            ConnectionError,
            TimeoutError,
            json.JSONDecodeError,
        ) as exc:
            response = {}
            latency_ms = 0
            result = {"passed": False, "assignment_count_actual": 0}
            error = f"{type(exc).__name__}: {exc}"
            error_category = classify_error(exc)

        failed_checks = [
            name
            for name, passed in result.items()
            if name not in {"passed", "assignment_count_actual"} and not passed
        ]
        raw_lines.append(
            json.dumps(
                {
                    "case_id": case["id"],
                    "request": case["input"],
                    "response": response,
                    "latency_ms": latency_ms,
                    "error": error,
                },
                ensure_ascii=False,
            )
        )
        rows.append(
            {
                "case_id": case["id"],
                "taxonomy": case["taxonomy"],
                "frequency": case["frequency"],
                "expected_status": case["expected"]["status"],
                "actual_status": response.get("status", "error"),
                "assignment_count_actual": result["assignment_count_actual"],
                "automated_pass": result["passed"],
                "failed_checks": ",".join(failed_checks),
                "latency_ms": latency_ms,
                "error_category": error_category,
                "notes": error,
            }
        )
        print(
            f"{'PASS' if result['passed'] else 'FAIL'} | {case['id']} | {latency_ms} ms"
        )

    RAW_LOG.write_text("\n".join(raw_lines) + "\n", encoding="utf-8")
    with RESULTS.open("w", newline="", encoding="utf-8-sig") as file:
        writer = csv.DictWriter(file, fieldnames=rows[0].keys())
        writer.writeheader()
        writer.writerows(rows)

    passed = sum(bool(row["automated_pass"]) for row in rows)
    average_latency = round(sum(int(row["latency_ms"]) for row in rows) / len(rows))
    print(f"\nResult: {passed}/{len(rows)} passed ({passed / len(rows):.1%})")
    print(f"Average latency: {average_latency} ms")


if __name__ == "__main__":
    run_assignment_eval()
