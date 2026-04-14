from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class ProjectCreate(BaseModel):
    name: str


class ProjectPublic(BaseModel):
    id: UUID
    name: str
    created_at: datetime

    class Config:
        from_attributes = True


class ProjectHistoryItem(BaseModel):
    id: UUID
    type: str
    created_at: datetime
    summary: str


class ProjectHistory(BaseModel):
    project_id: UUID
    items: list[ProjectHistoryItem]
