from fastapi import FastAPI

from app.api.router import api_router
from app.core.config import settings
from app.db.base import Base
from app.db.session import engine
from app.models import code_session, diagram, project, user  # noqa: F401

app = FastAPI(title=settings.app_name)
from app.models import diagram, project, user  # noqa: F401

app = FastAPI(title=settings.app_name)
from app.db.base import Base
from app.db.session import engine
from app.models import project, user  # noqa: F401

app = FastAPI(title="NDEX – Neural Design Explorer")


@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)


app.include_router(api_router)


@app.get("/")
def root():
    return {"status": "NDEX backend running"}
