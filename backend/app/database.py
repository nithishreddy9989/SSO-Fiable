import os
import logging
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from app.config import settings

logger = logging.getLogger("database")

# Primary DATABASE_URL (PostgreSQL) or fallback to SQLite for local ease
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://postgres:root@localhost:5432/SSO")

# Fallback engine if PostgreSQL database connection is unavailable
SQLITE_URL = "sqlite+aiosqlite:///./sso_clients.db"

Base = declarative_base()


def get_engine():
    try:
        # Use postgresql if configured
        if "postgresql" in DATABASE_URL:
            return create_async_engine(DATABASE_URL, echo=False, pool_pre_ping=True)
        return create_async_engine(SQLITE_URL, echo=False)
    except Exception as e:
        logger.warning(f"Defaulting to SQLite async engine due to DB config: {e}")
        return create_async_engine(SQLITE_URL, echo=False)


engine = get_engine()
AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def get_db():
    """FastAPI async database session dependency."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


async def init_db():
    """Initialize database tables and seed default sample clients."""
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("Database initialized successfully.")
    except Exception as e:
        logger.warning(f"PostgreSQL connection failed, initializing SQLite fallback: {e}")
        fallback_engine = create_async_engine(SQLITE_URL, echo=False)
        async with fallback_engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
