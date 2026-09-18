from src.agent.tools import (
    detect_checkpoint_risks,
    get_task_context,
    search_lab_context,
    summarize_team_progress,
)


def test_search_lab_context_returns_reference() -> None:
    result = search_lab_context.invoke(
        {
            "query": "nộp slide PDF",
            "documents": [
                {
                    "ref_id": "lab#cp5",
                    "source_type": "requirement",
                    "title": "CP5",
                    "content": "Nộp slide định dạng PDF trước 22:30.",
                },
                {
                    "ref_id": "lab#intro",
                    "source_type": "guide",
                    "title": "Giới thiệu",
                    "content": "Mini Hackathon AI.",
                },
            ],
        }
    )

    assert result["found"] is True
    assert result["matches"][0]["ref_id"] == "lab#cp5"


def test_get_task_context_only_returns_explicit_references() -> None:
    result = get_task_context.invoke(
        {
            "task_id": "t1",
            "tasks": [{"id": "t1", "reference_ids": ["ref-1"]}],
            "documents": [
                {"ref_id": "ref-1", "content": "Allowed"},
                {"ref_id": "ref-2", "content": "Not referenced"},
            ],
        }
    )

    assert [item["ref_id"] for item in result["references"]] == ["ref-1"]


def test_summarize_team_progress_is_deterministic() -> None:
    result = summarize_team_progress.invoke(
        {
            "tasks": [
                {"id": "t1", "status": "done", "owner_id": "m1"},
                {"id": "t2", "status": "blocked", "owner_id": "m2"},
                {"id": "t3", "status": "todo", "owner_id": None},
            ]
        }
    )

    assert result["progress_percent"] == 33
    assert result["blocked_task_ids"] == ["t2"]
    assert result["unassigned_task_ids"] == ["t3"]


def test_detect_checkpoint_risks_flags_near_due_checkpoint() -> None:
    result = detect_checkpoint_risks.invoke(
        {
            "now_iso": "2026-09-18T10:00:00+07:00",
            "warning_hours": 6,
            "checkpoints": [
                {
                    "id": "cp3",
                    "title": "Video + số đo",
                    "due_at": "2026-09-18T16:00:00+07:00",
                    "required_task_ids": ["t1", "t2"],
                }
            ],
            "tasks": [
                {"id": "t1", "status": "done"},
                {"id": "t2", "status": "in_progress"},
            ],
        }
    )

    assert result["has_risk"] is True
    assert result["alerts"][0]["reason"] == "checkpoint_at_risk"
    assert result["alerts"][0]["incomplete_task_ids"] == ["t2"]
