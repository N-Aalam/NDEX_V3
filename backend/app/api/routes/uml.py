from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.crud.diagram import create_diagram, list_diagrams
from app.schemas.diagram import DiagramPublic, UMLGenerateRequest
from app.services.uml import generate_uml

router = APIRouter(prefix="/uml", tags=["uml"])


@router.post("/generate", response_model=DiagramPublic)
def generate(request: UMLGenerateRequest, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    diagram_json = generate_uml(request.input_text)
    return create_diagram(
        db,
        project_id=request.project_id,
        diagram_type=request.diagram_type,
        input_text=request.input_text,
        diagram_json=diagram_json,
    )


@router.get("/list", response_model=list[DiagramPublic])
def list_for_project(
    project_id: UUID, db: Session = Depends(get_db), current_user=Depends(get_current_user)
):
    return list_diagrams(db, project_id)
