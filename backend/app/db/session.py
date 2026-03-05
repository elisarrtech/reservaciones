from collections.abc import AsyncGenerator
from urllib.parse import parse_qsl, urlencode, urlparse, urlunparse

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import get_settings


def _normalize_database_url(raw_url: str) -> str:
    url = raw_url
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql+asyncpg://", 1)
    elif url.startswith("postgresql://"):
        url = url.replace("postgresql://", "postgresql+asyncpg://", 1)

    if not url.startswith("postgresql+asyncpg://"):
        return url

    parsed = urlparse(url)
    query_params = parse_qsl(parsed.query, keep_blank_values=True)
    normalized_query: list[tuple[str, str]] = []
    for key, value in query_params:
        if key == "sslmode":
            normalized_query.append(("ssl", value))
            continue
        normalized_query.append((key, value))

    return urlunparse(parsed._replace(query=urlencode(normalized_query)))


settings = get_settings()
engine = create_async_engine(
    _normalize_database_url(settings.database_url),
    pool_pre_ping=True,
)
async_session_factory = async_sessionmaker(engine, expire_on_commit=False)


async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_factory() as session:
        yield session
