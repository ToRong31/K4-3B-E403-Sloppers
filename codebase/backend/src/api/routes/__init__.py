from fastapi import APIRouter

from src.api.routes.assignments import router as assignments_router
from src.api.routes.health import router as health_router
from src.api.routes.labs import router as labs_router

router = APIRouter()
router.include_router(health_router)
router.include_router(assignments_router)
router.include_router(labs_router)
