from src.infrastructure.lab_manifest_store import LabManifestStore


def test_loads_bundled_mini_hackathon_manifest() -> None:
    manifest = LabManifestStore().load("K4-L3B-DAY05-06-MINI-HACKATHON", 1)

    assert manifest["title"].startswith("Lab 05–06")
    assert [checkpoint["checkpoint_id"] for checkpoint in manifest["checkpoints"]] == [
        "prepare",
        "cp1",
        "cp2",
        "cp3",
        "cp4",
        "cp5",
        "cp6",
    ]
