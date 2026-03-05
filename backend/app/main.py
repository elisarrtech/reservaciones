from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import (
    admin_reservations_router,
    health_router,
    public_reservations_router,
)
from app.core.config import get_settings
from app.db.base import Base
from app.db.session import engine

# Ensure models are imported so SQLAlchemy metadata includes them on startup.
from app.models import Reservation  # noqa: F401

settings = get_settings()
app = FastAPI(
    title=settings.app_name,
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router, prefix=settings.api_v1_prefix)
app.include_router(public_reservations_router, prefix=settings.api_v1_prefix)
app.include_router(admin_reservations_router, prefix=settings.api_v1_prefix)


@app.on_event("startup")
async def on_startup() -> None:
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)

