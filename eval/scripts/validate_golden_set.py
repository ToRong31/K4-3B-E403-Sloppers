import argparse
import csv
import json
from collections import Counter
from pathlib import Path

EVAL_ROOT = Path(__file__).parents[1]
REPOSITORY_ROOT = EVAL_ROOT.parent
DATASETS = {
    "task_analysis": EVAL_ROOT / "golden-set-task-analysis.json",
    "assignment": EVAL_ROOT / "golden-set-assignment.json",
}
TAXONOMY_LAYERS = (
    "1_source_truth",
    "2_ambiguity_missing_information",
    "3_out_of_scope_authority",
    "4_domain_specific",
)


def load_chatlog_ids(path: Path) -> set[str]:
    if path.suffix == ".json":
        payload = json.loads(path.read_text(encoding="utf-8"))
        return {str(record["turn_id"]) for record in payload.get("records", [])}
    if path.suffix == ".csv":
        with path.open(encoding="utf-8-sig", newline="") as file:
            return {str(row["turn_id"]) for row in csv.DictReader(file)}
    return set()


def validate_dataset(name: str, path: Path) -> tuple[list[str], list[str]]:
    payload = json.loads(path.read_text(encoding="utf-8"))
    cases = payload["cases"]
    ids = [case["id"] for case in cases]
    taxonomy = Counter(case.get("taxonomy") for case in cases)
    frequency = Counter(case.get("frequency") for case in cases)
    provenance = Counter(case.get("provenance", {}).get("kind") for case in cases)

    errors: list[str] = []
    blockers: list[str] = []
    if len(cases) < 20:
        errors.append(f"need at least 20 cases, found {len(cases)}")
    if len(ids) != len(set(ids)):
        errors.append("case IDs must be unique")
    for layer in TAXONOMY_LAYERS:
        if taxonomy[layer] < 2:
            errors.append(f"{layer} needs at least 2 cases")
    if not 8 <= frequency["common"] <= 10:
        errors.append("common cases must be between 8 and 10")
    if not 2 <= frequency["rare"] <= 4:
        errors.append("rare cases must be between 2 and 4")

    chatlog_cases = [
        case
        for case in cases
        if case.get("provenance", {}).get("kind") == "chatlog_derived"
    ]
    if len(chatlog_cases) < 10:
        blockers.append(
            f"need 10 verified chatlog-derived cases, currently marked {len(chatlog_cases)}"
        )

    verified_raw_cases = []
    for case in chatlog_cases:
        source = case["provenance"]
        if source.get("verification") != "raw_chatlog_verified":
            continue
        raw_path = source.get("raw_path")
        source_path = REPOSITORY_ROOT / raw_path if raw_path else None
        if source_path and source_path.is_file():
            source_ids = load_chatlog_ids(source_path)
            if str(source.get("chatlog_id")) in source_ids:
                verified_raw_cases.append(case)
    if len(verified_raw_cases) < 10:
        blockers.append(
            "need 10 chatlog cases with verification=raw_chatlog_verified "
            f"and an existing raw_path; found {len(verified_raw_cases)}"
        )

    print(f"\n{name}: {len(cases)} cases")
    print(f"  Taxonomy: {dict(taxonomy)}")
    print(f"  Frequency: {dict(frequency)}")
    print(f"  Provenance: {dict(provenance)}")
    print(f"  Coverage structure: {'PASS' if not errors else 'FAIL'}")
    print(f"  Submission provenance: {'READY' if not blockers else 'BLOCKED'}")
    return errors, blockers


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--submission-ready",
        action="store_true",
        help="Exit non-zero when raw chatlog provenance is not ready.",
    )
    args = parser.parse_args()

    all_errors: list[str] = []
    all_blockers: list[str] = []
    for name, path in DATASETS.items():
        errors, blockers = validate_dataset(name, path)
        all_errors.extend(f"{name}: {error}" for error in errors)
        all_blockers.extend(f"{name}: {blocker}" for blocker in blockers)

    if all_errors:
        print("\nSTRUCTURE ERRORS")
        for error in all_errors:
            print(f"- {error}")
        raise SystemExit(1)

    print("\nCoverage structure: PASS for both primary golden sets")
    if all_blockers:
        print("Submission readiness: BLOCKED")
        for blocker in all_blockers:
            print(f"- {blocker}")
        if args.submission_ready:
            raise SystemExit(1)
    else:
        print("Submission readiness: READY")


if __name__ == "__main__":
    main()
