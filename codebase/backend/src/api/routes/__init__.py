from fastapi import APIRouter

from src.api.routes.assignments import router as assignments_router
from src.api.routes.health import router as health_router

router = APIRouter()
router.include_router(health_router)
router.include_router(assignments_router)
