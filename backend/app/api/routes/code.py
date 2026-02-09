from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.crud.code_session import create_code_session
from app.schemas.code import CodeAnalyzeRequest, CodeSessionPublic
from app.services.code_analysis import analyze_code

router = APIRouter(prefix="/code", tags=["code"])


@router.post("/analyze", response_model=CodeSessionPublic)
def analyze(request: CodeAnalyzeRequest, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    if request.language.lower() != "python":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only python is supported in MVP")
    execution_graph = analyze_code(request.code)
    return create_code_session(db, request.project_id, request.language, execution_graph)
