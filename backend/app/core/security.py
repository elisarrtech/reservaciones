from typing import Annotated

from fastapi import Header, HTTPException, status

from app.core.config import get_settings


def require_admin_token(
    x_admin_token: Annotated[str | None, Header()] = None,
) -> None:
    settings = get_settings()
    if not x_admin_token or x_admin_token != settings.admin_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing X-Admin-Token",
        )

