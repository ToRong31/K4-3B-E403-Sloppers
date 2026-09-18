from langgraph.checkpoint.memory import MemorySaver

from src.agent.progress.graph import build_progress_graph, progress_graph
from src.agent.progress.tools import get_my_tasks, search_lab_context

USER_ID = "member-1"
GROUP_ID = "group-1"
LAB_ID = "lab-1"
THREAD_ID = "thread-1"


def _state(question: str, *, task_id: str | None = None) -> dict:
    state = {
        "user_id": USER_ID,
        "group_id": GROUP_ID,
        "lab_id": LAB_ID,
        "thread_id": THREAD_ID,
        "question": question,
        "tasks": [
            {
                "id": "task-2",
                "group_id": GROUP_ID,
                "owner_id": USER_ID,
                "checkpoint_order": 2,
                "task_order": 2,
                "title": "Chạy eval",
                "status": "todo",
                "deliverable": "eval/results.json",
                "completion_criteria": ["Lưu pass và fail"],
                "depends_on": ["task-1"],
                "reference_ids": ["lab://lab-1/cp3/1"],
            },
            {
                "id": "task-1",
                "group_id": GROUP_ID,
                "owner_id": USER_ID,
                "checkpoint_order": 2,
                "task_order": 1,
                "title": "Tạo golden set",
                "status": "done",
                "deliverable": "eval/golden.jsonl",
                "completion_criteria": ["Có ít nhất 20 case"],
                "depends_on": [],
                "reference_ids": ["lab://lab-1/cp3/1"],
            },
            {
                "id": "other-member-task",
                "group_id": GROUP_ID,
                "owner_id": "member-2",
                "checkpoint_order": 1,
                "task_order": 1,
                "title": "Task riêng của người khác",
                "status": "todo",
                "reference_ids": ["lab://lab-1/cp3/1"],
            },
            {
                "id": "other-group-task",
                "group_id": "group-2",
                "owner_id": USER_ID,
                "checkpoint_order": 1,
                "task_order": 1,
                "title": "Task của nhóm khác",
                "status": "done",
                "reference_ids": ["lab://lab-1/cp3/1"],
            },
        ],
        "documents": [
            {
                "lab_id": LAB_ID,
                "ref_id": "lab://lab-1/cp3/1",
                "title": "Golden set",
                "content": "Chuẩn bị ít nhất 20 case và ghi pass/fail.",
            }
        ],
    }
    if task_id:
        state["task_id"] = task_id
    return state


def test_get_my_tasks_is_private_and_uses_canonical_order() -> None:
    tasks = get_my_tasks(USER_ID, GROUP_ID, _state("x")["tasks"])

    assert [task["id"] for task in tasks] == ["task-1", "task-2"]


def test_lab_search_does_not_cross_lab_or_checkpoint_boundaries() -> None:
    matches = search_lab_context(
        LAB_ID,
        "golden set",
        [
            {"lab_id": LAB_ID, "checkpoint_id": "cp3", "ref_id": "right", "content": "golden set"},
            {"lab_id": "lab-2", "checkpoint_id": "cp3", "ref_id": "wrong-lab", "content": "golden set"},
            {"lab_id": LAB_ID, "checkpoint_id": "cp4", "ref_id": "wrong-cp", "content": "golden set"},
        ],
        checkpoint_id="cp3",
    )

    assert [match["ref_id"] for match in matches] == ["right"]


def test_private_chat_refuses_task_owned_by_another_member() -> None:
    result = progress_graph.invoke(_state("Task này làm thế nào?", task_id="other-member-task"))

    assert result["status"] == "clarify"
    assert result["task_ids"] == []
    assert result["reference_ids"] == []


def test_private_chat_explains_owned_task_with_real_lab_reference() -> None:
    result = progress_graph.invoke(_state("Task này làm thế nào?", task_id="task-1"))

    assert result["status"] == "ready"
    assert result["task_ids"] == ["task-1"]
    assert result["reference_ids"] == ["lab://lab-1/cp3/1"]
    assert "eval/golden.jsonl" in result["answer"]


def test_progress_uses_current_group_task_state() -> None:
    result = progress_graph.invoke(_state("Nhóm còn bao nhiêu việc?"))

    assert result["response"]["data"] == {
        "total_tasks": 3,
        "done_tasks": 1,
        "remaining_tasks": 2,
        "blocked_tasks": 0,
        "unassigned_tasks": 0,
        "progress_percent": 33,
    }


def test_follow_up_same_thread_keeps_task_context_but_reads_fresh_task_data() -> None:
    graph = build_progress_graph(checkpointer=MemorySaver())
    config = {"configurable": {"thread_id": THREAD_ID}}
    graph.invoke(_state("Task này làm thế nào?", task_id="task-2"), config=config)

    fresh_state = _state("Còn việc đó thì sao?")
    fresh_state["tasks"][0]["status"] = "in_progress"
    result = graph.invoke(fresh_state, config=config)

    assert result["status"] == "ready"
    assert result["task_ids"] == ["task-2"]
    assert result["response"]["data"]["task"]["status"] == "in_progress"
