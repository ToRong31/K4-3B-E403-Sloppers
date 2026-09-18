from typing import Any

from fastapi import APIRouter

from src.infrastructure.json_store import get_json_store

router = APIRouter(tags=["labs"])


@router.get("/labs")
def list_labs() -> list[dict[str, Any]]:
    store = get_json_store()
    return store.get_labs()
