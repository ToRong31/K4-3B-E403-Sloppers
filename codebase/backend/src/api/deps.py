from functools import lru_cache
from typing import Any

from src.agent.assignment.graph import build_assignment_graph
from src.infrastructure.llm.factory import build_chat_model


@lru_cache
def get_assignment_graph() -> Any:
    """One compiled graph per process; override this dependency in tests."""
    return build_assignment_graph()


@lru_cache
def get_chat_model() -> Any:
    """Build only the provider selected by LLM_PROVIDER and reuse it per process."""
    return build_chat_model()
