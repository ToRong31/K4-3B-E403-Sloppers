from fastapi import APIRouter

from src.api.routes.assignments import router as assignments_router
from src.api.routes.auth import router as auth_router
from src.api.routes.chat import router as chat_router
from src.api.routes.coach import router as coach_router
from src.api.routes.health import router as health_router
from src.api.routes.labs import router as labs_router
from src.api.routes.realtime import router as realtime_router
from src.api.routes.submissions import router as submissions_router
from src.api.routes.workspace import router as workspace_router

router = APIRouter()
router.include_router(health_router)
router.include_router(auth_router)
router.include_router(assignments_router)
router.include_router(chat_router)
router.include_router(labs_router)
router.include_router(workspace_router)
router.include_router(coach_router)
router.include_router(submissions_router)
router.include_router(realtime_router)
