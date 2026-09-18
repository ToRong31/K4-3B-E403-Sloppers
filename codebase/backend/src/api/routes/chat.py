import logging
from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException, status

from src.api.deps import get_chat_service, get_workspace_repository
from src.infrastructure.database.repositories import WorkspaceRepository
from src.models.schemas import ChatRequest, ChatResponse
from src.services.chat import ChatModelInvocationError, ChatService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/chat", tags=["chat"])
ChatServiceDep = Annotated[ChatService, Depends(get_chat_service)]
WorkspaceRepo = Annotated[WorkspaceRepository, Depends(get_workspace_repository)]


@router.get("/history")
def get_ai_chat_history(
    repo: WorkspaceRepo,
    thread_id: str | None = None,
    user_id: str | None = None,
    group_id: str | None = None,
) -> list[dict[str, Any]]:
    resolved_thread_id = thread_id
    if not resolved_thread_id and group_id and user_id:
        resolved_thread_id = f"{group_id}:{user_id}"
    return repo.list_ai_chat_messages(
        thread_id=resolved_thread_id,
        user_id=user_id,
        group_id=group_id,
    )


@router.delete("/history")
def clear_ai_chat_history(
    repo: WorkspaceRepo,
    thread_id: str | None = None,
    user_id: str | None = None,
    group_id: str | None = None,
) -> dict[str, Any]:
    resolved_thread_id = thread_id
    if not resolved_thread_id and group_id and user_id:
        resolved_thread_id = f"{group_id}:{user_id}"
    cleared = repo.clear_ai_chat_messages(
        thread_id=resolved_thread_id,
        user_id=user_id,
        group_id=group_id,
    )
    return {"status": "cleared", "count": cleared}


@router.post("", response_model=ChatResponse)
def handle_chat_message(
    payload: ChatRequest,
    service: ChatServiceDep,
    repo: WorkspaceRepo,
) -> ChatResponse:
    thread_id = payload.thread_id or (
        f"{payload.group_id}:{payload.user_id}"
        if payload.group_id and payload.user_id
        else payload.user_id or "default"
    )

    is_img = bool(payload.attachment_type and payload.attachment_type.startswith("image/"))
    image_url = payload.attachment_url if is_img else None
    file_name = payload.attachment_name if (not is_img and payload.attachment_name) else None
    file_type = payload.attachment_type if not is_img else None
    file_data = payload.attachment_url if not is_img else None

    if payload.attachment_name and payload.attachment_url:
        try:
            repo.save_file_attachment(
                filename=payload.attachment_name,
                content_type=payload.attachment_type or "application/octet-stream",
                file_url=payload.attachment_url,
                group_id=payload.group_id,
                user_id=payload.user_id,
                channel="ai",
                is_image=is_img,
            )
        except Exception as exc:
            logger.warning("Could not persist AI chat attachment to DB: %s", exc)

    # Persist user question to ai_chat_messages
    try:
        repo.save_ai_chat_message(
            thread_id=thread_id,
            user_id=payload.user_id,
            group_id=payload.group_id,
            lab_id=payload.lab_id,
            role="user",
            content=payload.message,
            image_url=image_url,
            file_name=file_name,
            file_type=file_type,
            file_data=file_data,
        )
    except Exception as exc:
        logger.warning("Could not persist user message to AI chat history: %s", exc)

    try:
        response = service.process_message(payload)
    except ChatModelInvocationError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(exc),
        ) from exc

    # Persist assistant reply to ai_chat_messages
    try:
        repo.save_ai_chat_message(
            thread_id=thread_id,
            user_id=payload.user_id,
            group_id=payload.group_id,
            lab_id=payload.lab_id,
            role="assistant",
            content=response.answer,
            status=response.status,
            suggested_next_action=response.suggested_next_action,
            task_ids=response.task_ids,
            reference_ids=response.reference_ids,
        )
    except Exception as exc:
        logger.warning("Could not persist assistant response to AI chat history: %s", exc)

    return response


