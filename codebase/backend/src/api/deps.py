from functools import lru_cache
from typing import Any

from src.agent.graph import build_assignment_graph


@lru_cache
def get_assignment_graph() -> Any:
    """One compiled graph per process; override this dependency in tests."""
    return build_assignment_graph()
