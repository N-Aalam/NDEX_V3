from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.models.code_session import CodeSession
from app.models.diagram import Diagram
from app.models.project import Project
from app.models.repository import Repository
from app.schemas.dashboard import DashboardSummary

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/summary", response_model=DashboardSummary)
def summary(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    total_projects = db.query(func.count(Project.id)).filter(Project.user_id == current_user.id).scalar() or 0

    project_ids = [item[0] for item in db.query(Project.id).filter(Project.user_id == current_user.id).all()]
    total_diagrams = db.query(func.count(Diagram.id)).filter(Diagram.project_id.in_(project_ids)).scalar() or 0
    total_code_sessions = db.query(func.count(CodeSession.id)).filter(CodeSession.project_id.in_(project_ids)).scalar() or 0
    total_repo_analyses = db.query(func.count(Repository.id)).filter(Repository.project_id.in_(project_ids)).scalar() or 0

    recent_projects = (
        db.query(Project)
        .filter(Project.user_id == current_user.id)
        .order_by(Project.created_at.desc())
        .limit(5)
        .all()
    )

    return DashboardSummary(
        total_projects=total_projects,
        total_diagrams=total_diagrams,
        total_code_sessions=total_code_sessions,
        total_repo_analyses=total_repo_analyses,
        recent_projects=recent_projects,
    )
