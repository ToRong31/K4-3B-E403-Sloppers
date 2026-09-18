from typing import Annotated

from fastapi import APIRouter, Depends

from src.api.deps import get_assignment_draft_service
from src.models.schemas import AssignmentDraftRequest, AssignmentDraftResponse
from src.services.assignment_drafts import AssignmentDraftService

router = APIRouter(prefix="/assignments", tags=["assignments"])
AssignmentServiceDep = Annotated[AssignmentDraftService, Depends(get_assignment_draft_service)]


@router.post("/draft", response_model=AssignmentDraftResponse)
def create_assignment_draft(
    payload: AssignmentDraftRequest,
    service: AssignmentServiceDep,
) -> AssignmentDraftResponse:
    return service.create(payload)
