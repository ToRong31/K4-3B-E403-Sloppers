from fastapi.testclient import TestClient

from src.api.main import create_app
from src.core.config import Settings


def make_client() -> TestClient:
    return TestClient(create_app(Settings(app_debug=True)))


def test_analyze_lab_endpoint_happy_path() -> None:
    manifest = {
        "lab_id": "lab-101",
        "version": 1,
        "title": "Lab 101",
        "checkpoints": [
            {
                "checkpoint_id": "cp1",
                "checkpoint_order": 1,
                "title": "Checkpoint 1",
                "items": [
                    {
                        "item_id": "it1",
                        "item_order": 1,
                        "source_type": "deliverable",
                        "title": "Canvas",
                        "content": "Hoàn thành Canvas",
                        "ref_id": "lab://lab-101/v1/cp1/it1",
                        "is_required": True,
                    }
                ],
            }
        ],
    }

    response = make_client().post(
        "/api/v1/labs/analyze",
        json={"lab_manifest": manifest},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ready"
    assert "checklist_draft" in body
    assert body["checklist_draft"]["lab_id"] == "lab-101"


def test_analyze_lab_endpoint_missing_reference_clarify() -> None:
    manifest = {
        "lab_id": "lab-101",
        "version": 1,
        "title": "Lab 101",
        "checkpoints": [
            {
                "checkpoint_id": "cp1",
                "checkpoint_order": 1,
                "title": "Checkpoint 1",
                "items": [
                    {
                        "item_id": "it1",
                        "item_order": 1,
                        "source_type": "deliverable",
                        "title": "Canvas",
                        "content": "Hoàn thành Canvas",
                        "ref_id": "",
                        "is_required": True,
                    }
                ],
            }
        ],
    }

    response = make_client().post(
        "/api/v1/labs/analyze",
        json={"lab_manifest": manifest},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "clarify"
    assert body["gaps"]

