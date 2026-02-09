from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, HttpUrl


class RepoAnalyzeRequest(BaseModel):
    project_id: UUID
    repo_url: HttpUrl


class RepositoryPublic(BaseModel):
    id: UUID
    project_id: UUID
    repo_url: str
    dependency_graph: dict
    commits: list[dict]
    created_at: datetime

    class Config:
        from_attributes = True
