from src.agent.progress.graph import progress_graph
from src.agent.router_graph import router_graph
from src.agent.task_analysis.graph import task_analysis_graph


def test_task_analysis_prepares_grounded_model_request() -> None:
    result = task_analysis_graph.invoke(
        {
            "lab_id": "lab-1",
            "documents": [{"ref_id": "lab://lab-1/cp1", "content": "Nộp Canvas 7 dòng."}],
        }
    )

    assert result["status"] == "awaiting_model"
    assert "lab://lab-1/cp1" in result["model_request"]["user"]


def test_progress_subgraph_reads_fresh_task_state() -> None:
    result = progress_graph.invoke(
        {
            "question": "Tiến độ nhóm còn bao nhiêu?",
            "tasks": [
                {"id": "t1", "status": "done", "owner_id": "m1"},
                {"id": "t2", "status": "todo", "owner_id": "m2"},
            ],
        }
    )

    assert result["response"]["data"]["progress_percent"] == 50


def test_parent_router_dispatches_to_assignment_subgraph() -> None:
    result = router_graph.invoke(
        {
            "operation": "assign_tasks",
            "group_name": "Sloppers",
            "members": [{"id": "m1", "name": "Dương", "skills": ["AI"]}],
            "tasks": [{"id": "t1", "title": "AI evaluation", "deliverable": "golden set"}],
        }
    )

    assert result["status"] == "ready"
    assert result["assignments"][0]["owner_id"] == "m1"


def test_parent_router_rejects_unknown_operation() -> None:
    result = router_graph.invoke({"operation": "do_everything"})

    assert result["status"] == "clarify"
    assert result["gaps"]
