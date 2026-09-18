from langgraph.graph import END, START, StateGraph

from src.agent.assignment.graph import assignment_graph
from src.agent.progress.graph import progress_graph
from src.agent.router_state import RouterState
from src.agent.task_analysis.graph import task_analysis_graph

SUPPORTED_OPERATIONS = {"analyze_lab", "assign_tasks", "progress"}


def route_request(_: RouterState) -> RouterState:
    return {}


def select_subgraph(state: RouterState) -> str:
    operation = state.get("operation", "")
    return operation if operation in SUPPORTED_OPERATIONS else "unsupported"


def unsupported_operation(state: RouterState) -> RouterState:
    return {
        "status": "clarify",
        "gaps": [f"Operation không được hỗ trợ: {state.get('operation', '')}"],
    }


def build_router_graph(checkpointer=None, store=None):
    builder = StateGraph(RouterState)
    builder.add_node("route_request", route_request)
    builder.add_node("analyze_lab", task_analysis_graph)
    builder.add_node("assign_tasks", assignment_graph)
    builder.add_node("progress", progress_graph)
    builder.add_node("unsupported", unsupported_operation)
    builder.add_edge(START, "route_request")
    builder.add_conditional_edges(
        "route_request",
        select_subgraph,
        {
            "analyze_lab": "analyze_lab",
            "assign_tasks": "assign_tasks",
            "progress": "progress",
            "unsupported": "unsupported",
        },
    )
    for node_name in ("analyze_lab", "assign_tasks", "progress", "unsupported"):
        builder.add_edge(node_name, END)
    return builder.compile(checkpointer=checkpointer, store=store)


router_graph = build_router_graph()
