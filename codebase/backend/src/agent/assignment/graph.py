from langgraph.graph import END, START, StateGraph

from src.agent.assignment.nodes import (
    build_assignment_draft,
    load_assignment_context_node,
    request_clarification,
    route_after_validation,
    score_candidates,
    validate_assignment_draft_node,
    validate_members_and_skills,
)
from src.agent.assignment.state import AssignmentState


def build_assignment_graph():
    builder = StateGraph(AssignmentState)
    builder.add_node("load_assignment_context", load_assignment_context_node)
    builder.add_node("validate_members_and_skills", validate_members_and_skills)
    builder.add_node("request_clarification", request_clarification)
    builder.add_node("score_candidates", score_candidates)
    builder.add_node("build_assignment_draft", build_assignment_draft)
    builder.add_node("validate_assignment_draft", validate_assignment_draft_node)

    builder.add_edge(START, "load_assignment_context")
    builder.add_edge("load_assignment_context", "validate_members_and_skills")
    builder.add_conditional_edges(
        "validate_members_and_skills",
        route_after_validation,
        {
            "clarify": "request_clarification",
            "score": "score_candidates",
        },
    )
    builder.add_edge("score_candidates", "build_assignment_draft")
    builder.add_edge("build_assignment_draft", "validate_assignment_draft")
    builder.add_edge("request_clarification", END)
    builder.add_edge("validate_assignment_draft", END)
    return builder.compile()


assignment_graph = build_assignment_graph()
