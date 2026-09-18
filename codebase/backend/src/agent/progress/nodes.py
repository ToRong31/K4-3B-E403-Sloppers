from src.agent.progress.state import ProgressState
from src.agent.tools import get_task_context, summarize_team_progress


def classify_intent(state: ProgressState) -> ProgressState:
    question = state.get("question", "").casefold()
    if any(term in question for term in ("tiến độ", "bao nhiêu", "còn lại", "hoàn thành")):
        return {"intent": "progress"}
    if state.get("task_id") or any(term in question for term in ("task", "việc", "giải thích")):
        return {"intent": "explain"}
    return {"intent": "clarify"}


def route_intent(state: ProgressState) -> str:
    return state["intent"]


def summarize_progress(state: ProgressState) -> ProgressState:
    summary = summarize_team_progress.invoke({"tasks": state.get("tasks", [])})
    return {
        "status": "ready",
        "response": {"type": "progress_summary", "data": summary},
        "references": [],
    }


def explain_task(state: ProgressState) -> ProgressState:
    context = get_task_context.invoke(
        {
            "task_id": state.get("task_id", ""),
            "tasks": state.get("tasks", []),
            "documents": state.get("documents", []),
        }
    )
    references = [str(item["ref_id"]) for item in context["references"]]
    return {
        "status": "ready" if context["found"] else "clarify",
        "response": {"type": "task_context", "data": context},
        "references": references,
    }


def request_clarification(_: ProgressState) -> ProgressState:
    return {
        "status": "clarify",
        "response": {
            "type": "clarification",
            "message": "Bạn muốn xem tiến độ nhóm hay giải thích task nào?",
        },
        "references": [],
    }
