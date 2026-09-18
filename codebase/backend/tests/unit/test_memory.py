from src.memory.namespaces import conversation_namespace, user_memory_namespace


def test_memory_namespaces_are_isolated() -> None:
    assert conversation_namespace("group-1", "thread-1") != conversation_namespace(
        "group-1", "thread-2"
    )
    assert user_memory_namespace("user-1") != user_memory_namespace("user-2")
