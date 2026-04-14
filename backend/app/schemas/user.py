from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, EmailStr


class UserCreate(BaseModel):
    email: EmailStr
    password: str


class UserProfileUpdate(BaseModel):
    preferred_theme: Literal["light", "dark"] | None = None


class UserPublic(BaseModel):
    id: UUID
    email: EmailStr
    created_at: datetime
    preferred_theme: str | None = None

    class Config:
        from_attributes = True
