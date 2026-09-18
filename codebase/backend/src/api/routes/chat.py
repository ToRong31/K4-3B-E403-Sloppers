from typing import Annotated

from fastapi import APIRouter, Depends

from src.api.deps import get_chat_service
from src.models.schemas import ChatRequest, ChatResponse
from src.services.chat import ChatService

router = APIRouter(prefix="/chat", tags=["chat"])
ChatServiceDep = Annotated[ChatService, Depends(get_chat_service)]


@router.post("", response_model=ChatResponse)
def handle_chat_message(
    payload: ChatRequest,
    service: ChatServiceDep,
) -> ChatResponse:
    return service.process_message(payload)
