from fastapi import APIRouter

from app.api.routes import auth, code, dashboard, projects, repo, uml, users

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(projects.router)
api_router.include_router(dashboard.router)
api_router.include_router(uml.router)
api_router.include_router(code.router)
api_router.include_router(repo.router)
