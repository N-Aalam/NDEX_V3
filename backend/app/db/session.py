from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import OperationalError

from app.core.config import settings

def _build_engine(database_url: str):
    connect_args = {"check_same_thread": False} if database_url.startswith("sqlite") else {}
    return create_engine(database_url, connect_args=connect_args)


engine = _build_engine(settings.database_url)
try:
    with engine.connect():
        pass
except OperationalError:
    fallback_url = "sqlite:///./ndex.db"
    if not settings.database_url.startswith("sqlite"):
        print("WARNING: Primary database unreachable. Falling back to local sqlite database.")
        engine = _build_engine(fallback_url)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
