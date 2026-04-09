from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.crud.project import get_project_for_user
from app.crud.repository import create_repository
from app.schemas.repository import RepoAnalyzeRequest, RepositoryPublic
from app.services.ai_service import build_repo_intelligence
from app.services.github import GitHubRepoError, fetch_repo_tree

router = APIRouter(prefix="/repo", tags=["repo"])


@router.post("/analyze", response_model=RepositoryPublic)
def analyze(request: RepoAnalyzeRequest, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    if not get_project_for_user(db, current_user.id, request.project_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    try:
        dependency_graph = fetch_repo_tree(str(request.repo_url))
    except GitHubRepoError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Failed to fetch repository") from exc

    intelligence = build_repo_intelligence(dependency_graph)
    dependency_graph["ai_insights"] = intelligence

    return create_repository(
        db,
        request.project_id,
        str(request.repo_url),
        dependency_graph,
        dependency_graph.get("commits", []),
    )
