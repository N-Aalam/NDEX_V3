from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class CodeAnalyzeRequest(BaseModel):
    project_id: UUID
    language: str = "python"
    code: str


class CodeSessionPublic(BaseModel):
    id: UUID
    project_id: UUID
    language: str
    execution_graph: dict
    created_at: datetime

    class Config:
        from_attributes = True
