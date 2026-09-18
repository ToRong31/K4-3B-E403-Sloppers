from langgraph.graph import END, START, StateGraph

from src.agent.progress.nodes import (
    authorize_scope,
    build_grounded_answer,
    classify_intent,
    explain_task,
    load_my_tasks,
    request_clarification,
    route_intent,
    summarize_progress,
)
from src.agent.progress.state import ProgressState


def build_progress_graph(checkpointer=None):
    """Build a private-chat graph; callers may provide a thread checkpointer."""

    builder = StateGraph(ProgressState)
    builder.add_node("authorize_scope", authorize_scope)
    builder.add_node("classify_intent", classify_intent)
    builder.add_node("get_my_tasks", load_my_tasks)
    builder.add_node("summarize_progress", summarize_progress)
    builder.add_node("explain_task", explain_task)
    builder.add_node("request_clarification", request_clarification)
    builder.add_node("build_grounded_answer", build_grounded_answer)
    builder.add_edge(START, "authorize_scope")
    builder.add_edge("authorize_scope", "classify_intent")
    builder.add_conditional_edges(
        "classify_intent",
        route_intent,
        {
            "my_tasks": "get_my_tasks",
            "progress": "summarize_progress",
            "explain": "explain_task",
            "clarify": "request_clarification",
        },
    )
    for node_name in (
        "get_my_tasks",
        "summarize_progress",
        "explain_task",
        "request_clarification",
    ):
        builder.add_edge(node_name, "build_grounded_answer")
    builder.add_edge("build_grounded_answer", END)
    return builder.compile(checkpointer=checkpointer)


progress_graph = build_progress_graph()
