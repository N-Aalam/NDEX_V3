from sqlalchemy.orm import Session

from app.models.project import Project
from app.schemas.project import ProjectCreate


def create_project(db: Session, user_id, project_in: ProjectCreate) -> Project:
    project = Project(user_id=user_id, name=project_in.name)
    db.add(project)
    db.commit()
    db.refresh(project)
    return project


def list_projects(db: Session, user_id):
    return db.query(Project).filter(Project.user_id == user_id).order_by(Project.created_at.desc()).all()


def delete_project(db: Session, user_id, project_id) -> bool:
    project = db.query(Project).filter(Project.user_id == user_id, Project.id == project_id).first()
    if not project:
        return False
    db.delete(project)
    db.commit()
    return True
