from langgraph.graph import END, START, StateGraph

from src.agent.nodes import (
    assign_tasks,
    request_clarification,
    route_after_validation,
    validate_input,
)
from src.agent.state import AssignmentState


def build_assignment_graph():
    builder = StateGraph(AssignmentState)
    builder.add_node("validate_input", validate_input)
    builder.add_node("request_clarification", request_clarification)
    builder.add_node("assign_tasks", assign_tasks)
    builder.add_edge(START, "validate_input")
    builder.add_conditional_edges(
        "validate_input",
        route_after_validation,
        {
            "clarify": "request_clarification",
            "assign": "assign_tasks",
        },
    )
    builder.add_edge("request_clarification", END)
    builder.add_edge("assign_tasks", END)
    return builder.compile()


assignment_graph = build_assignment_graph()
