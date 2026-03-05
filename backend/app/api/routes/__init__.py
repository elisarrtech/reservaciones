from app.api.routes.admin_reservations import router as admin_reservations_router
from app.api.routes.health import router as health_router
from app.api.routes.public_reservations import router as public_reservations_router

__all__ = [
    "admin_reservations_router",
    "health_router",
    "public_reservations_router",
]

