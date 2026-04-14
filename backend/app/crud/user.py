from sqlalchemy.orm import Session

from app.core.security import get_password_hash
from app.models.user import User
from app.schemas.user import UserCreate, UserProfileUpdate


def get_user_by_email(db: Session, email: str) -> User | None:
    return db.query(User).filter(User.email == email).first()


def create_user(db: Session, user_in: UserCreate) -> User:
    user = User(email=user_in.email, password_hash=get_password_hash(user_in.password))
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def update_user_profile(db: Session, user: User, user_in: UserProfileUpdate) -> User:
    if user_in.preferred_theme is not None:
        user.preferred_theme = user_in.preferred_theme

    db.add(user)
    db.commit()
    db.refresh(user)
    return user
