from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class UMLGenerateRequest(BaseModel):
    project_id: UUID
    input_text: str
    diagram_type: str = "class"


class DiagramPublic(BaseModel):
    id: UUID
    project_id: UUID
    type: str
    input_text: str
    diagram_json: dict
    created_at: datetime

    class Config:
        from_attributes = True
