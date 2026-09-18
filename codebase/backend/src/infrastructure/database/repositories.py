from typing import Any
from uuid import UUID

from sqlalchemy.orm import Session

from src.infrastructure.database.models import AssignmentDraftRecord


class AssignmentDraftRepository:
    def __init__(self, session: Session) -> None:
        self.session = session

    def save(
        self,
        *,
        group_name: str,
        status: str,
        request_payload: dict[str, Any],
        result_payload: dict[str, Any],
    ) -> UUID:
        record = AssignmentDraftRecord(
            group_name=group_name,
            status=status,
            request_payload=request_payload,
            result_payload=result_payload,
        )
        self.session.add(record)
        self.session.commit()
        self.session.refresh(record)
        return record.id
