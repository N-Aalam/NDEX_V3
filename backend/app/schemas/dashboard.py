from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class DashboardRecentProject(BaseModel):
    id: UUID
    name: str
    created_at: datetime

    class Config:
        from_attributes = True


class DashboardSummary(BaseModel):
    total_projects: int
    total_diagrams: int
    total_code_sessions: int
    total_repo_analyses: int
    recent_projects: list[DashboardRecentProject]
