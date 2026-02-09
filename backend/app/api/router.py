from fastapi import APIRouter

from app.api.routes import auth, code, projects, uml
from app.api.routes import auth, projects, uml
from app.api.routes import auth, projects

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(projects.router)
api_router.include_router(uml.router)
api_router.include_router(code.router)
