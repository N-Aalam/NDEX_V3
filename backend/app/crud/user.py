from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.core.security import get_password_hash
from app.models.user import User
from app.schemas.user import UserCreate, UserProfileUpdate


def get_user_by_email(db: Session, email: str) -> User | None:
    return db.query(User).filter(User.email == email).first()


def get_user_by_id(db: Session, user_id) -> User | None:
    return db.query(User).filter(User.id == user_id).first()


def create_user(db: Session, user_in: UserCreate) -> User:
    user = User(
        email=user_in.email,
        password_hash=get_password_hash(user_in.password),
        full_name=user_in.full_name,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def mark_user_login(db: Session, user: User) -> User:
    user.last_login_at = datetime.now(timezone.utc)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def update_user_profile(db: Session, user: User, profile_in: UserProfileUpdate) -> User:
    payload = profile_in.model_dump(exclude_unset=True)
    for key, value in payload.items():
        setattr(user, key, str(value) if key == "avatar_url" and value is not None else value)

    db.add(user)
    db.commit()
    db.refresh(user)
    return user
