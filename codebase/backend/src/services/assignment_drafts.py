from typing import Any

from src.infrastructure.database.repositories import AssignmentDraftRepository
from src.models.schemas import AssignmentDraftRequest, AssignmentDraftResponse


class AssignmentDraftService:
    def __init__(self, graph: Any, repository: AssignmentDraftRepository) -> None:
        self.graph = graph
        self.repository = repository

    def create(self, payload: AssignmentDraftRequest) -> AssignmentDraftResponse:
        request_data = payload.model_dump(mode="json")
        response = AssignmentDraftResponse.model_validate(self.graph.invoke(request_data))
        self.repository.save(
            group_name=payload.group_name,
            status=response.status.value,
            request_payload=request_data,
            result_payload=response.model_dump(mode="json"),
        )
        return response
