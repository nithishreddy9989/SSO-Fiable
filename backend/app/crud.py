from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models import ClientConfig, User
from app.auth.security import hash_password


async def get_all_clients(db: AsyncSession) -> List[ClientConfig]:
    """Retrieve all active registered client configurations."""
    result = await db.execute(select(ClientConfig).filter(ClientConfig.is_active == True))
    clients = result.scalars().all()
    if not clients:
        await seed_default_data(db)
        result = await db.execute(select(ClientConfig).filter(ClientConfig.is_active == True))
        clients = result.scalars().all()
    return clients


async def get_client_by_slug(db: AsyncSession, slug: str) -> Optional[ClientConfig]:
    """Find client configuration by unique slug (e.g., 'acme-corp')."""
    result = await db.execute(select(ClientConfig).filter(ClientConfig.slug == slug))
    return result.scalars().first()


async def get_client_by_domain(db: AsyncSession, domain: str) -> Optional[ClientConfig]:
    """Find client configuration by email domain suffix (e.g., 'acme.com')."""
    result = await db.execute(select(ClientConfig).filter(ClientConfig.domain_suffix == domain))
    return result.scalars().first()


async def create_client(db: AsyncSession, slug: str, name: str, domain: str, tenant_id: str, client_id: str, secret: Optional[str] = None) -> ClientConfig:
    """Register a new client organization with its own Azure Entra ID credentials."""
    client = ClientConfig(
        slug=slug.lower().replace(" ", "-"),
        client_name=name,
        domain_suffix=domain.lower(),
        azure_tenant_id=tenant_id,
        azure_client_id=client_id,
        azure_client_secret=secret,
        is_active=True
    )
    db.add(client)
    await db.commit()
    await db.refresh(client)
    return client


async def get_user_by_email(db: AsyncSession, email: str) -> Optional[User]:
    """Find user by email address."""
    result = await db.execute(select(User).filter(User.email == email.lower()))
    return result.scalars().first()


async def get_all_users(db: AsyncSession) -> List[User]:
    """Retrieve all registered users across all tenants."""
    result = await db.execute(select(User))
    return result.scalars().all()


async def create_user(db: AsyncSession, email: str, password: str, full_name: str, role: str = "User", client_id: Optional[int] = None) -> User:
    """Create a new user account with hashed password."""
    user = User(
        email=email.lower(),
        hashed_password=hash_password(password),
        full_name=full_name,
        role=role,
        client_id=client_id,
        is_active=True
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


async def seed_default_data(db: AsyncSession):
    """Seed initial sample client organizations & default SuperAdmin / Admin / User accounts."""
    # 1. Seed Sample Clients
    acme_client = ClientConfig(
        slug="acme-corp",
        client_name="Acme Corporation",
        domain_suffix="acme.com",
        azure_tenant_id="acme-tenant-id-8899",
        azure_client_id="acme-client-id-102",
        is_active=True
    )
    fiable_client = ClientConfig(
        slug="fiable-enterprise",
        client_name="Fiable Enterprise",
        domain_suffix="fiable-enterprise.onmicrosoft.com",
        azure_tenant_id="72f988bf-86f1-41af-91ab-2d7cd011db47",
        azure_client_id="fiable-client-id-001",
        is_active=True
    )
    db.add(acme_client)
    db.add(fiable_client)
    try:
        await db.commit()
        await db.refresh(acme_client)
        await db.refresh(fiable_client)
    except Exception:
        await db.rollback()
        return

    # 2. Seed Default Accounts for instant Email+Password Login
    default_users = [
        User(
            email="superadmin@platform.com",
            hashed_password=hash_password("SuperAdmin123!"),
            full_name="Global SuperAdmin",
            role="SuperAdmin",
            client_id=None,
            is_active=True
        ),
        User(
            email="admin@acme.com",
            hashed_password=hash_password("Admin123!"),
            full_name="Acme Corp Tenant Admin",
            role="Admin",
            client_id=acme_client.id,
            is_active=True
        ),
        User(
            email="user@acme.com",
            hashed_password=hash_password("User123!"),
            full_name="Standard Acme Employee",
            role="User",
            client_id=acme_client.id,
            is_active=True
        ),
    ]
    for u in default_users:
        db.add(u)
    try:
        await db.commit()
    except Exception:
        await db.rollback()
