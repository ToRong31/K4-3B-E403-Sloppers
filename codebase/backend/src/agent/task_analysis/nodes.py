from src.agent.prompts import TASK_ANALYSIS_SYSTEM_PROMPT, build_task_analysis_prompt
from src.agent.task_analysis.state import TaskAnalysisState


def validate_sources(state: TaskAnalysisState) -> TaskAnalysisState:
    documents = [item for item in state.get("documents", []) if item.get("content")]
    missing_references = [item for item in documents if not item.get("ref_id")]
    if not documents:
        return {"status": "clarify", "gaps": ["Chưa có dữ liệu bài LAB để phân tích."]}
    if missing_references:
        return {
            "status": "clarify",
            "gaps": ["Mọi document chunk phải có ref_id ổn định."],
        }
    return {"status": "ready", "gaps": []}


def route_after_validation(state: TaskAnalysisState) -> str:
    return "clarify" if state["status"] == "clarify" else "prepare"


def request_clarification(state: TaskAnalysisState) -> TaskAnalysisState:
    return {"status": "clarify", "gaps": state.get("gaps", []), "analyzed_tasks": []}


def prepare_model_request(state: TaskAnalysisState) -> TaskAnalysisState:
    """Prepare a provider-neutral request; the model adapter is intentionally separate."""
    return {
        "status": "awaiting_model",
        "model_request": {
            "system": TASK_ANALYSIS_SYSTEM_PROMPT,
            "user": build_task_analysis_prompt(
                {"lab_id": state.get("lab_id"), "documents": state["documents"]}
            ),
        },
    }
