def conversation_namespace(group_id: str, thread_id: str) -> tuple[str, ...]:
    """Thread-scoped memory for the progress assistant."""
    return ("conversations", group_id, thread_id)


def user_memory_namespace(user_id: str) -> tuple[str, ...]:
    """Explicit, durable preferences only; never inferred capability scores."""
    return ("users", user_id, "preferences")
