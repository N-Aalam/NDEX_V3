from sqlalchemy.orm import Session

from app.models.code_session import CodeSession


def create_code_session(db: Session, project_id, language: str, execution_graph: dict) -> CodeSession:
    session = CodeSession(
        project_id=project_id,
        language=language,
        execution_graph=execution_graph,
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session
