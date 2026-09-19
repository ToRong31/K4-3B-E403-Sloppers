import logging
from collections.abc import Callable
from functools import lru_cache
from typing import Annotated, Any

from fastapi import Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from src.agent.assignment.graph import build_assignment_graph
from src.agent.progress.graph import build_progress_graph
from src.agent.router_graph import build_router_graph
from src.infrastructure.checklist_store import ChecklistStore
from src.infrastructure.database.models import UserRecord
from src.infrastructure.database.repositories import (
    AssignmentDraftRepository,
    AuthRepository,
    WorkspaceRepository,
)
from src.infrastructure.lab_manifest_store import LabManifestStore
from src.infrastructure.llm.factory import build_chat_model
from src.services.assignment_drafts import AssignmentDraftService
from src.services.auth import AuthService, InvalidSessionError
from src.services.chat import ChatService

logger = logging.getLogger(__name__)


@lru_cache
def get_assignment_graph() -> Any:
    """One compiled assignment graph per process."""
    return build_assignment_graph()


@lru_cache
def get_router_graph() -> Any:
    """Compiled operation router used by public workflow endpoints."""
    return build_router_graph()


@lru_cache
def get_progress_graph() -> Any:
    """One compiled private progress-chat graph per process."""
    return build_progress_graph()


@lru_cache
def get_checklist_store() -> ChecklistStore:
    """Return the local prototype store for validated canonical checklists."""
    return ChecklistStore()


@lru_cache
def get_lab_manifest_store() -> LabManifestStore:
    """Return the bundled JSON LAB manifest reader."""
    return LabManifestStore()


def get_chat_model(request: Request) -> Any:
    """Build the selected model once per app using that app's settings."""
    model = request.app.state.chat_model
    if model is not None:
        return model
    try:
        model = build_chat_model(request.app.state.settings)
    except Exception as exc:
        logger.exception("Private chat model initialization failed")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Trợ lý AI chưa sẵn sàng. Kiểm tra cấu hình LLM của backend.",
        ) from exc
    request.app.state.chat_model = model
    return model


def get_db_session(request: Request):
    session_factory = request.app.state.db_session_factory
    with session_factory() as session:
        yield session


DatabaseSession = Annotated[Session, Depends(get_db_session)]


def get_auth_service(request: Request, session: DatabaseSession) -> AuthService:
    return AuthService(AuthRepository(session), request.app.state.settings.session_ttl_hours)


def get_workspace_repository(session: DatabaseSession) -> WorkspaceRepository:
    return WorkspaceRepository(session)


def get_current_user(
    request: Request, service: Annotated[AuthService, Depends(get_auth_service)]
) -> UserRecord:
    token = request.cookies.get(request.app.state.settings.session_cookie_name)
    try:
        return service.authenticate(token).user
    except InvalidSessionError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Phiên đăng nhập không hợp lệ hoặc đã hết hạn.",
        ) from exc


CurrentUser = Annotated[UserRecord, Depends(get_current_user)]


def require_roles(*roles: str) -> Callable[[CurrentUser], UserRecord]:
    def dependency(user: CurrentUser) -> UserRecord:
        if user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Bạn không có quyền thực hiện thao tác này.",
            )
        return user

    return dependency


def get_assignment_draft_service(
    session: DatabaseSession,
    graph: Annotated[Any, Depends(get_assignment_graph)],
) -> AssignmentDraftService:
    return AssignmentDraftService(graph, AssignmentDraftRepository(session))


def get_chat_service(
    graph: Annotated[Any, Depends(get_progress_graph)],
    model: Annotated[Any, Depends(get_chat_model)],
    lab_manifest_store: Annotated[LabManifestStore, Depends(get_lab_manifest_store)],
) -> ChatService:
    return ChatService(graph, llm=model, lab_manifest_store=lab_manifest_store)
