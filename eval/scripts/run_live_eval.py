import csv
import json
import os
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

ROOT = Path(__file__).parents[1]
DATASET = ROOT / "golden-set-task-analysis.json"
RESULTS = ROOT / "results" / "task-analysis-run-1.csv"
RAW_LOG = ROOT / "results" / "task-analysis-run-1-raw.jsonl"
DIAGNOSTICS_LOG = ROOT / "results" / "task-analysis-run-1-diagnostics.md"


def flatten_tasks(response: dict) -> list[dict]:
    if isinstance(response.get("tasks"), list):
        return response["tasks"]
    checklist = response.get("checklist", response)
    return [
        task
        for checkpoint in checklist.get("checkpoints", [])
        for task in checkpoint.get("tasks", [])
    ]


def grade(case: dict, response: dict) -> dict:
    tasks = flatten_tasks(response)
    expected = case["expected"]
    input_refs = {
        document.get("ref_id")
        for document in case["input"].get("documents", [])
        if document.get("ref_id")
    }
    output_refs = {
        reference for task in tasks for reference in task.get("reference_ids", [])
    }
    required_refs = set(expected["required_reference_ids"])
    schema_valid = (
        all(
            task.get("title")
            and task.get("deliverable")
            and task.get("completion_criteria")
            and task.get("checkpoint_id")
            and task.get("reference_ids")
            for task in tasks
        )
        if tasks
        else expected["must_not_create_tasks"]
    )
    checks = {
        "schema_valid": schema_valid,
        "expected_status": response.get("status") == expected["status"],
        "task_count": expected["min_tasks"] <= len(tasks) <= expected["max_tasks"],
        "references_valid": output_refs <= input_refs,
        "required_source_coverage": required_refs <= output_refs,
        "authority_boundary": not expected["must_not_create_tasks"] or not tasks,
    }
    return {**checks, "passed": all(checks.values()), "task_count_actual": len(tasks)}


def call_target(url: str, payload: dict) -> dict:
    request = Request(
        url,
        data=json.dumps(payload, ensure_ascii=False).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urlopen(request, timeout=120) as response:
        return json.loads(response.read().decode("utf-8"))


def classify_error(exc: Exception) -> str:
    if isinstance(exc, HTTPError):
        if exc.code == 404:
            return "endpoint_missing"
        if exc.code in {401, 403}:
            return "authentication_error"
        if exc.code == 429:
            return "rate_limit_error"
        return "target_http_error"
    if isinstance(exc, URLError):
        return "connection_error"
    return "runner_error"


def run_task_analysis_eval() -> None:
    target_url = os.environ.get(
        "EVAL_TARGET_URL",
        "http://127.0.0.1:8000/api/v1/labs/analyze",
    )

    cases = json.loads(DATASET.read_text(encoding="utf-8"))["cases"]
    rows = []
    raw_lines = []
    diagnostics = ["# Task Analysis live-eval diagnostics", ""]
    for case in cases:
        try:
            response = call_target(target_url, case["input"])
            result = grade(case, response)
            error = ""
            error_category = ""
        except (HTTPError, URLError, TimeoutError, json.JSONDecodeError) as exc:
            response = {}
            result = {"passed": False, "task_count_actual": 0}
            error = f"{type(exc).__name__}: {exc}"
            error_category = classify_error(exc)

        raw_lines.append(
            json.dumps(
                {
                    "case_id": case["id"],
                    "request": case["input"],
                    "response": response,
                    "error": error,
                },
                ensure_ascii=False,
            )
        )
        model_error = response.get("error", "")
        if model_error:
            diagnostics.extend(
                [
                    f"## {case['id']}",
                    "",
                    f"- Model error: `{model_error}`",
                    f"- API status: `{response.get('status', 'error')}`",
                    "",
                ]
            )
        rows.append(
            {
                "case_id": case["id"],
                "taxonomy": case["taxonomy"],
                "frequency": case["frequency"],
                "expected_status": case["expected"]["status"],
                "actual_status": response.get("status", "error"),
                "task_count_actual": result["task_count_actual"],
                "automated_pass": result["passed"],
                "human_rating": "not_scored",
                "error_category": error_category,
                "notes": error or model_error,
            }
        )
        print(f"{'PASS' if result['passed'] else 'FAIL'} | {case['id']}")

    RAW_LOG.write_text("\n".join(raw_lines) + "\n", encoding="utf-8")
    if len(diagnostics) == 2:
        diagnostics.append("Không có model error từ API.")
    DIAGNOSTICS_LOG.write_text("\n".join(diagnostics) + "\n", encoding="utf-8")
    with RESULTS.open("w", newline="", encoding="utf-8-sig") as file:
        writer = csv.DictWriter(file, fieldnames=rows[0].keys())
        writer.writeheader()
        writer.writerows(rows)

    passed = sum(row["automated_pass"] for row in rows)
    print(f"\nResult: {passed}/{len(rows)} passed ({passed / len(rows):.1%})")


def main() -> None:
    try:
        from eval.scripts.run_assignment_live_eval import run_assignment_eval
    except ModuleNotFoundError:
        from run_assignment_live_eval import run_assignment_eval

    print("=== Task Analysis live API eval ===")
    run_task_analysis_eval()
    print("\n=== Assignment live API eval ===")
    run_assignment_eval()


if __name__ == "__main__":
    main()
