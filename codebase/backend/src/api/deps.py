from functools import lru_cache
from typing import Annotated, Any

from fastapi import Depends, Request
from sqlalchemy.orm import Session

from src.agent.assignment.graph import build_assignment_graph
from src.infrastructure.database.repositories import AssignmentDraftRepository
from src.infrastructure.llm.factory import build_chat_model
from src.services.assignment_drafts import AssignmentDraftService


@lru_cache
def get_assignment_graph() -> Any:
    """One compiled graph per process; override this dependency in tests."""
    return build_assignment_graph()


@lru_cache
def get_chat_model() -> Any:
    """Build only the provider selected by LLM_PROVIDER and reuse it per process."""
    return build_chat_model()


def get_db_session(request: Request):
    session_factory = request.app.state.db_session_factory
    with session_factory() as session:
        yield session


DatabaseSession = Annotated[Session, Depends(get_db_session)]


def get_assignment_draft_service(
    session: DatabaseSession,
    graph: Annotated[Any, Depends(get_assignment_graph)],
) -> AssignmentDraftService:
    return AssignmentDraftService(graph, AssignmentDraftRepository(session))


from src.agent.progress.graph import build_progress_graph
from src.services.chat import ChatService


@lru_cache
def get_progress_graph() -> Any:
    return build_progress_graph()


def get_chat_service(
    graph: Annotated[Any, Depends(get_progress_graph)],
) -> ChatService:
    return ChatService(graph)

