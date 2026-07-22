"""NetShield AI - v1 API Router."""

from fastapi import APIRouter

from app.api.v1.auth import router as auth_router
from app.api.v1.users import router as users_router
from app.api.v1.roles import router as roles_router
from app.api.v1.teams import router as teams_router
from app.api.v1.traffic import router as traffic_router
from app.api.v1.audit import router as audit_router
from app.api.v1.dashboard import router as dashboard_router
from app.api.v1.system import router as system_router
from app.api.v1.traffic_ml import router as traffic_ml_router

api_v1_router = APIRouter(prefix="/api/v1")

api_v1_router.include_router(auth_router)
api_v1_router.include_router(users_router)
api_v1_router.include_router(roles_router)
api_v1_router.include_router(teams_router)
api_v1_router.include_router(traffic_router)
api_v1_router.include_router(traffic_ml_router)
api_v1_router.include_router(audit_router)
api_v1_router.include_router(dashboard_router)
api_v1_router.include_router(system_router)


