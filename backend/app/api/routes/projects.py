from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.crud.project import create_project, delete_project, list_projects
from app.schemas.project import ProjectCreate, ProjectPublic

router = APIRouter(prefix="/projects", tags=["projects"])


@router.post("/create", response_model=ProjectPublic)
def create(project_in: ProjectCreate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return create_project(db, current_user.id, project_in)


@router.get("/list", response_model=list[ProjectPublic])
def list_all(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return list_projects(db, current_user.id)


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete(project_id: UUID, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    deleted = delete_project(db, current_user.id, project_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
