from sqlalchemy.orm import Session

from app.models.repository import Repository


def create_repository(
    db: Session,
    project_id,
    repo_url: str,
    dependency_graph: dict,
    commits: list[dict],
) -> Repository:
    repository = Repository(
        project_id=project_id,
        repo_url=repo_url,
        dependency_graph=dependency_graph,
        commits=commits,
    )
    db.add(repository)
    db.commit()
    db.refresh(repository)
    return repository
