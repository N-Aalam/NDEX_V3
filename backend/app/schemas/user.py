from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, EmailStr, HttpUrl


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str | None = None


class UserProfileUpdate(BaseModel):
    full_name: str | None = None
    bio: str | None = None
    avatar_url: HttpUrl | None = None
    preferred_theme: str | None = None


class UserPublic(BaseModel):
    id: UUID
    email: EmailStr
    full_name: str | None = None
    bio: str | None = None
    avatar_url: str | None = None
    preferred_theme: str
    last_login_at: datetime | None = None
    created_at: datetime
    updated_at: datetime | None = None

    class Config:
        from_attributes = True
