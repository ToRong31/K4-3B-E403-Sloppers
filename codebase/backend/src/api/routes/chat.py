from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status

from src.api.deps import get_chat_service
from src.models.schemas import ChatRequest, ChatResponse
from src.services.chat import ChatModelInvocationError, ChatService

router = APIRouter(prefix="/chat", tags=["chat"])
ChatServiceDep = Annotated[ChatService, Depends(get_chat_service)]


@router.post("", response_model=ChatResponse)
def handle_chat_message(
    payload: ChatRequest,
    service: ChatServiceDep,
) -> ChatResponse:
    try:
        return service.process_message(payload)
    except ChatModelInvocationError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(exc),
        ) from exc
