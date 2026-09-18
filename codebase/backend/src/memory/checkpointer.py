from langgraph.checkpoint.memory import InMemorySaver


def build_dev_checkpointer() -> InMemorySaver:
    """Development-only checkpoint storage; use PostgresSaver in production."""
    return InMemorySaver()
