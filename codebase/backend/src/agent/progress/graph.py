from langgraph.graph import END, START, StateGraph

from src.agent.progress.nodes import (
    classify_intent,
    explain_task,
    request_clarification,
    route_intent,
    summarize_progress,
)
from src.agent.progress.state import ProgressState


def build_progress_graph():
    builder = StateGraph(ProgressState)
    builder.add_node("classify_intent", classify_intent)
    builder.add_node("summarize_progress", summarize_progress)
    builder.add_node("explain_task", explain_task)
    builder.add_node("request_clarification", request_clarification)
    builder.add_edge(START, "classify_intent")
    builder.add_conditional_edges(
        "classify_intent",
        route_intent,
        {
            "progress": "summarize_progress",
            "explain": "explain_task",
            "clarify": "request_clarification",
        },
    )
    builder.add_edge("summarize_progress", END)
    builder.add_edge("explain_task", END)
    builder.add_edge("request_clarification", END)
    return builder.compile()


progress_graph = build_progress_graph()
