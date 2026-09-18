from langgraph.graph import END, START, StateGraph

from src.agent.task_analysis.nodes import (
    prepare_model_request,
    request_clarification,
    route_after_validation,
    validate_sources,
)
from src.agent.task_analysis.state import TaskAnalysisState


def build_task_analysis_graph():
    builder = StateGraph(TaskAnalysisState)
    builder.add_node("validate_sources", validate_sources)
    builder.add_node("request_clarification", request_clarification)
    builder.add_node("prepare_model_request", prepare_model_request)
    builder.add_edge(START, "validate_sources")
    builder.add_conditional_edges(
        "validate_sources",
        route_after_validation,
        {"clarify": "request_clarification", "prepare": "prepare_model_request"},
    )
    builder.add_edge("request_clarification", END)
    builder.add_edge("prepare_model_request", END)
    return builder.compile()


task_analysis_graph = build_task_analysis_graph()
