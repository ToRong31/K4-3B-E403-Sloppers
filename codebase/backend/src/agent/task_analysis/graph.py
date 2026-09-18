from langgraph.graph import END, START, StateGraph

from src.agent.task_analysis.nodes import (
    analyze_each_checkpoint,
    build_checklist_draft,
    check_requirement_coverage_node,
    load_lab,
    prepare_model_request,
    request_clarification,
    route_after_checkpoint_analysis,
    route_after_coverage,
    route_after_task_validation,
    route_after_validation,
    validate_sources,
    validate_task_draft,
)
from src.agent.task_analysis.state import TaskAnalysisState


def build_task_analysis_graph():
    builder = StateGraph(TaskAnalysisState)

    # Core nodes
    builder.add_node("load_lab", load_lab)
    builder.add_node("validate_sources", validate_sources)
    builder.add_node("request_clarification", request_clarification)
    builder.add_node("prepare_model_request", prepare_model_request)
    builder.add_node("analyze_each_checkpoint", analyze_each_checkpoint)
    builder.add_node("validate_task_draft", validate_task_draft)
    builder.add_node("check_requirement_coverage", check_requirement_coverage_node)
    builder.add_node("build_checklist_draft", build_checklist_draft)

    # Graph edges
    builder.add_edge(START, "load_lab")
    builder.add_edge("load_lab", "validate_sources")

    builder.add_conditional_edges(
        "validate_sources",
        route_after_validation,
        {
            "clarify": "request_clarification",
            "prepare": "prepare_model_request",
            "analyze": "analyze_each_checkpoint",
        },
    )

    builder.add_conditional_edges(
        "analyze_each_checkpoint",
        route_after_checkpoint_analysis,
        {
            "clarify": "request_clarification",
            "validate": "validate_task_draft",
        },
    )

    builder.add_conditional_edges(
        "validate_task_draft",
        route_after_task_validation,
        {
            "clarify": "request_clarification",
            "check_coverage": "check_requirement_coverage",
        },
    )

    builder.add_conditional_edges(
        "check_requirement_coverage",
        route_after_coverage,
        {
            "clarify": "request_clarification",
            "build_draft": "build_checklist_draft",
        },
    )

    builder.add_edge("request_clarification", END)
    builder.add_edge("prepare_model_request", END)
    builder.add_edge("build_checklist_draft", END)

    return builder.compile()


task_analysis_graph = build_task_analysis_graph()
