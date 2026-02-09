from sqlalchemy.orm import Session

from app.models.diagram import Diagram


def create_diagram(db: Session, project_id, diagram_type: str, input_text: str, diagram_json: dict) -> Diagram:
    diagram = Diagram(
        project_id=project_id,
        type=diagram_type,
        input_text=input_text,
        diagram_json=diagram_json,
    )
    db.add(diagram)
    db.commit()
    db.refresh(diagram)
    return diagram


def list_diagrams(db: Session, project_id):
    return (
        db.query(Diagram)
        .filter(Diagram.project_id == project_id)
        .order_by(Diagram.created_at.desc())
        .all()
    )
