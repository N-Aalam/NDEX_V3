from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.crud.project import create_project, delete_project, get_project_for_user, list_projects
from app.models.code_session import CodeSession
from app.models.diagram import Diagram
from app.models.repository import Repository
from app.schemas.project import ProjectCreate, ProjectHistory, ProjectHistoryItem, ProjectPublic

router = APIRouter(prefix="/projects", tags=["projects"])


@router.post("/create", response_model=ProjectPublic)
def create(project_in: ProjectCreate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return create_project(db, current_user.id, project_in)


@router.get("/list", response_model=list[ProjectPublic])
def list_all(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return list_projects(db, current_user.id)


@router.get("/{project_id}/history", response_model=ProjectHistory)
def project_history(project_id: UUID, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    project = get_project_for_user(db, current_user.id, project_id)
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    items: list[ProjectHistoryItem] = []

    diagrams = db.query(Diagram).filter(Diagram.project_id == project_id).all()
    items.extend(
        ProjectHistoryItem(
            id=item.id,
            type="uml",
            created_at=item.created_at,
            summary=item.diagram_json.get("title", f"{item.type} diagram"),
        )
        for item in diagrams
    )

    code_sessions = db.query(CodeSession).filter(CodeSession.project_id == project_id).all()
    items.extend(
        ProjectHistoryItem(
            id=item.id,
            type="code",
            created_at=item.created_at,
            summary=f"{item.language} analysis ({len(item.execution_graph.get('steps', []))} steps)",
        )
        for item in code_sessions
    )

    repos = db.query(Repository).filter(Repository.project_id == project_id).all()
    items.extend(
        ProjectHistoryItem(
            id=item.id,
            type="repo",
            created_at=item.created_at,
            summary=item.repo_url,
        )
        for item in repos
    )

    items.sort(key=lambda item: item.created_at, reverse=True)
    return ProjectHistory(project_id=project_id, items=items)


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete(project_id: UUID, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    deleted = delete_project(db, current_user.id, project_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
