import logging
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status

from src.api.deps import get_chat_service, get_workspace_repository
from src.infrastructure.database.repositories import WorkspaceRepository
from src.models.schemas import ChatRequest, ChatResponse
from src.services.chat import ChatModelInvocationError, ChatService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/chat", tags=["chat"])
ChatServiceDep = Annotated[ChatService, Depends(get_chat_service)]
WorkspaceRepo = Annotated[WorkspaceRepository, Depends(get_workspace_repository)]


@router.post("", response_model=ChatResponse)
def handle_chat_message(
    payload: ChatRequest,
    service: ChatServiceDep,
    repo: WorkspaceRepo,
) -> ChatResponse:
    if payload.attachment_name and payload.attachment_url:
        try:
            repo.save_file_attachment(
                filename=payload.attachment_name,
                content_type=payload.attachment_type or "application/octet-stream",
                file_url=payload.attachment_url,
                group_id=payload.group_id,
                user_id=payload.user_id,
                channel="ai",
                is_image=(payload.attachment_type or "").startswith("image/"),
            )
        except Exception as exc:
            logger.warning("Could not persist AI chat attachment to DB: %s", exc)

    try:
        return service.process_message(payload)
    except ChatModelInvocationError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(exc),
        ) from exc

