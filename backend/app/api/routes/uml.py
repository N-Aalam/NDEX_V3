from uuid import UUID
import base64

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.crud.diagram import create_diagram, list_diagrams
from app.schemas.diagram import DiagramPublic, UMLGenerateRequest
from app.services.ai_service import generate_mermaid_uml

router = APIRouter(prefix="/uml", tags=["uml"])


@router.post("/generate", response_model=DiagramPublic)
def generate(request: UMLGenerateRequest, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    result = generate_mermaid_uml(request.input_text, request.diagram_type)
    mermaid_code = result.get("mermaid_code", "")
    encoded = base64.urlsafe_b64encode(mermaid_code.encode("utf-8")).decode("utf-8")
    diagram_json = {
        "diagram_type": request.diagram_type,
        "title": result.get("title", "AI UML"),
        "mermaid_code": mermaid_code,
        "image_url": f"https://mermaid.ink/img/{encoded}",
    }
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
