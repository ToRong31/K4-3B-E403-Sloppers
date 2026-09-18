import json
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).parents[1]
DATASET = ROOT / "golden-set-task-analysis.json"


def main() -> None:
    payload = json.loads(DATASET.read_text(encoding="utf-8"))
    cases = payload["cases"]
    ids = [case["id"] for case in cases]
    taxonomy = Counter(case["taxonomy"] for case in cases)
    frequency = Counter(case["frequency"] for case in cases)
    provenance = Counter(case["provenance"]["kind"] for case in cases)

    errors = []
    if len(cases) < 20:
        errors.append(f"Need at least 20 cases, found {len(cases)}")
    if len(ids) != len(set(ids)):
        errors.append("Case IDs must be unique")
    for layer in (
        "1_source_truth",
        "2_ambiguity_missing_information",
        "3_out_of_scope_authority",
        "4_domain_specific",
    ):
        if taxonomy[layer] < 2:
            errors.append(f"{layer} needs at least 2 cases")
    if not 8 <= frequency["common"] <= 10:
        errors.append("Common cases must be between 8 and 10")
    if not 2 <= frequency["rare"] <= 4:
        errors.append("Rare cases must be between 2 and 4")
    if provenance["chatlog_derived"] < 10:
        errors.append("Need at least 10 chatlog-derived cases")

    for case in cases:
        expected = case["expected"]
        documents = case["input"].get("documents", [])
        available_refs = {doc.get("ref_id") for doc in documents if doc.get("ref_id")}
        unknown_refs = set(expected["required_reference_ids"]) - available_refs
        if unknown_refs:
            errors.append(f"{case['id']} expects unknown refs: {sorted(unknown_refs)}")
        if expected["min_tasks"] > expected["max_tasks"]:
            errors.append(f"{case['id']} has invalid task range")

    print(f"Cases: {len(cases)}")
    print(f"Taxonomy: {dict(taxonomy)}")
    print(f"Frequency: {dict(frequency)}")
    print(f"Provenance: {dict(provenance)}")
    if errors:
        print("\nFAILED")
        for error in errors:
            print(f"- {error}")
        raise SystemExit(1)
    print("\nGolden set structure: PASS")


if __name__ == "__main__":
    main()
