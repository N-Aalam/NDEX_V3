from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import inspect, text

from app.api.router import api_router
from app.core.config import settings
from app.db.base import Base
from app.db.session import engine
from app.models import code_session, diagram, project, repository, user  # noqa: F401
from app.models import code_session, diagram, project, user  # noqa: F401

app = FastAPI(title=settings.app_name)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)


app.include_router(api_router)
    if engine.dialect.name == "sqlite":
        inspector = inspect(engine)
        if "repositories" in inspector.get_table_names():
            columns = {col["name"] for col in inspector.get_columns("repositories")}
            if "commits" not in columns:
                with engine.begin() as conn:
                    conn.execute(text("ALTER TABLE repositories ADD COLUMN commits TEXT"))


app.include_router(api_router)


@app.get("/")
def root():
    return {"status": "NDEX backend running"}
