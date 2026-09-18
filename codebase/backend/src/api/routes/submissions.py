from typing import Any

from fastapi import APIRouter
from pydantic import BaseModel, HttpUrl

from src.infrastructure.json_store import get_json_store

router = APIRouter(prefix="/submissions", tags=["submissions"])


class CheckGithubRequest(BaseModel):
    repo_url: str


@router.post("/check-github")
def check_github_submission(payload: CheckGithubRequest) -> dict[str, Any]:
    store = get_json_store()
    return store.check_github_submission(payload.repo_url)
