from typing import Optional, Dict, Any, List
from fastapi import APIRouter, Header, HTTPException, Depends, Query, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from app.config import settings
from app.database import get_db
from app.crud import (
    get_all_clients, 
    get_client_by_slug, 
    get_client_by_domain, 
    create_client,
    get_user_by_email,
    get_all_users,
    create_user
)
from app.auth.security import hash_password, verify_password, create_access_token, decode_access_token
from app.auth.verifier import verify_entra_token, generate_mock_user_claims

router = APIRouter(prefix="/api/auth", tags=["Authentication & RBAC"])


class EmailPasswordLoginRequest(BaseModel):
    email: str
    password: str


class RegisterUserRequest(BaseModel):
    email: str
    password: str
    full_name: str
    role: Optional[str] = "User"  # 'SuperAdmin', 'Admin', 'User'
    client_slug: Optional[str] = None


class TokenVerifyRequest(BaseModel):
    token: str


class MockLoginRequest(BaseModel):
    email: Optional[str] = "superadmin@platform.com"
    name: Optional[str] = "Global SuperAdmin"
    tenant_type: Optional[str] = "single_tenant"
    role: Optional[str] = "SuperAdmin"


class CreateClientRequest(BaseModel):
    slug: str
    client_name: str
    domain_suffix: str
    azure_tenant_id: str
    azure_client_id: str
    azure_client_secret: Optional[str] = None


@router.get("/config")
async def get_sso_config():
    """Returns Microsoft Entra ID configuration metadata."""
    return {
        "clientId": settings.AZURE_CLIENT_ID,
        "tenantId": settings.AZURE_TENANT_ID,
        "authority": settings.AZURE_AUTHORITY,
        "redirectUri": settings.REDIRECT_URI,
        "mockMode": settings.MOCK_AUTH_MODE,
        "isConfigured": settings.AZURE_CLIENT_ID != "your-entra-client-id-here"
    }


# ==========================================
# EMAIL & PASSWORD LOGIN (No ID Required)
# ==========================================
@router.post("/login")
async def email_password_login(payload: EmailPasswordLoginRequest, db: AsyncSession = Depends(get_db)):
    """
    Direct Email + Password Authentication for SuperAdmin, Tenant Admins, and Users.
    No Client ID or Tenant ID required!
    """
    user = await get_user_by_email(db, payload.email)
    
    # Auto-seed if database is freshly created
    if not user and payload.email.lower() == "superadmin@platform.com" and payload.password == "SuperAdmin123!":
        clients = await get_all_clients(db)
        user = await get_user_by_email(db, payload.email)

    if not user or not user.hashed_password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email address or password"
        )

    if not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email address or password"
        )

    client_slug = None
    client_name = "Global Platform"
    if user.client_id:
        clients = await get_all_clients(db)
        client_obj = next((c for c in clients if c.id == user.client_id), None)
        if client_obj:
            client_slug = client_obj.slug
            client_name = client_obj.client_name

    claims = {
        "sub": str(user.id),
        "name": user.full_name,
        "email": user.email,
        "role": user.role,
        "roles": [user.role, "User.Read"],
        "client_slug": client_slug,
        "client_name": client_name,
        "idp": "Fiable Identity Engine"
    }

    token = create_access_token(claims)

    return {
        "access_token": token,
        "token_type": "Bearer",
        "user": claims
    }


@router.post("/register")
async def register_new_user(payload: RegisterUserRequest, db: AsyncSession = Depends(get_db)):
    """Register a new user account with role assignment."""
    existing = await get_user_by_email(db, payload.email)
    if existing:
        raise HTTPException(status_code=400, detail="User with this email already exists")

    client_id = None
    if payload.client_slug:
        client = await get_client_by_slug(db, payload.client_slug)
        if client:
            client_id = client.id

    new_user = await create_user(
        db,
        email=payload.email,
        password=payload.password,
        full_name=payload.full_name,
        role=payload.role or "User",
        client_id=client_id
    )

    return {
        "message": "User registered successfully",
        "user_id": new_user.id,
        "email": new_user.email,
        "role": new_user.role
    }


# ==========================================
# SUPERADMIN PLATFORM METRICS & TENANT MANAGEMENT
# ==========================================
@router.get("/superadmin/summary")
async def get_superadmin_summary(authorization: Optional[str] = Header(None), db: AsyncSession = Depends(get_db)):
    """Platform summary endpoint accessible to SuperAdmin."""
    clients = await get_all_clients(db)
    users = await get_all_users(db)

    return {
        "platform": "Fiable Enterprise Multi-Tenant SSO Engine",
        "total_clients": len(clients),
        "total_users": len(users),
        "roles_breakdown": {
            "SuperAdmin": sum(1 for u in users if u.role == "SuperAdmin"),
            "Admin": sum(1 for u in users if u.role == "Admin"),
            "User": sum(1 for u in users if u.role == "User"),
        },
        "clients": [
            {
                "id": c.id,
                "slug": c.slug,
                "client_name": c.client_name,
                "domain_suffix": c.domain_suffix,
                "user_count": sum(1 for u in users if u.client_id == c.id)
            }
            for c in clients
        ]
    }


# ==========================================
# MULTI-CLIENT REGISTRY & OIDC ENDPOINTS
# ==========================================
@router.get("/clients")
async def list_registered_clients(db: AsyncSession = Depends(get_db)):
    """Retrieve all registered client organizations from database."""
    clients = await get_all_clients(db)
    return [
        {
            "id": c.id,
            "slug": c.slug,
            "client_name": c.client_name,
            "domain_suffix": c.domain_suffix,
            "azure_tenant_id": c.azure_tenant_id,
            "azure_client_id": c.azure_client_id,
            "is_active": c.is_active
        }
        for c in clients
    ]


@router.get("/clients/resolve")
async def resolve_client_config(
    domain: Optional[str] = Query(None), 
    slug: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    """Dynamically resolve a client's Entra ID configuration by email domain or client slug."""
    client = None
    if slug:
        client = await get_client_by_slug(db, slug)
    elif domain:
        if "@" in domain:
            domain = domain.split("@")[1]
        client = await get_client_by_domain(db, domain)

    if not client:
        return {
            "resolved": False,
            "client_name": "Default Entra Tenant",
            "azure_tenant_id": settings.AZURE_TENANT_ID,
            "azure_client_id": settings.AZURE_CLIENT_ID,
            "authority": f"https://login.microsoftonline.com/{settings.AZURE_TENANT_ID}"
        }

    return {
        "resolved": True,
        "slug": client.slug,
        "client_name": client.client_name,
        "domain_suffix": client.domain_suffix,
        "azure_tenant_id": client.azure_tenant_id,
        "azure_client_id": client.azure_client_id,
        "authority": f"https://login.microsoftonline.com/{client.azure_tenant_id}"
    }


@router.post("/clients")
async def register_new_client(payload: CreateClientRequest, db: AsyncSession = Depends(get_db)):
    """Register a new client organization with its own Entra ID credentials."""
    existing = await get_client_by_slug(db, payload.slug)
    if existing:
        raise HTTPException(status_code=400, detail=f"Client slug '{payload.slug}' already exists")

    new_client = await create_client(
        db,
        slug=payload.slug,
        name=payload.client_name,
        domain=payload.domain_suffix,
        tenant_id=payload.azure_tenant_id,
        client_id=payload.azure_client_id,
        secret=payload.azure_client_secret
    )
    return {"message": "Client registered successfully", "client_id": new_client.id, "slug": new_client.slug}


@router.post("/verify")
async def verify_token_endpoint(body: Optional[TokenVerifyRequest] = None, authorization: Optional[str] = Header(None)):
    """Verifies Bearer token (JWT or Microsoft Entra ID) and returns decoded claims."""
    token = None
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ")[1]
    elif body and body.token:
        token = body.token

    if not token:
        raise HTTPException(status_code=400, detail="Bearer token is required")

    decoded_internal = decode_access_token(token)
    if decoded_internal:
        return {
            "valid": True,
            "status": "verified_email_password_jwt",
            "claims": decoded_internal,
            "message": "Token verified via Fiable SSO Security Engine."
        }

    result = verify_entra_token(token)
    if not result.get("valid"):
        raise HTTPException(status_code=401, detail=result.get("error", "Invalid or expired token"))

    return result


@router.get("/me")
async def get_current_user_profile(authorization: Optional[str] = Header(None)):
    """Returns authenticated user identity and roles."""
    if not authorization:
        if settings.MOCK_AUTH_MODE:
            return {"authenticated": True, "user": generate_mock_user_claims()}
        raise HTTPException(status_code=401, detail="Authorization header missing")

    token = authorization.replace("Bearer ", "").strip()
    
    decoded_internal = decode_access_token(token)
    if decoded_internal:
        return {
            "authenticated": True,
            "user": {
                "name": decoded_internal.get("name", "User"),
                "email": decoded_internal.get("email", ""),
                "role": decoded_internal.get("role", "User"),
                "roles": decoded_internal.get("roles", ["User"]),
                "client_slug": decoded_internal.get("client_slug"),
                "client_name": decoded_internal.get("client_name"),
                "idp": "Fiable Identity Engine"
            },
            "token_status": "verified_internal_jwt"
        }

    result = verify_entra_token(token)
    if not result.get("valid"):
        raise HTTPException(status_code=401, detail=result.get("error", "Unauthorized"))

    claims = result.get("claims", {})
    return {
        "authenticated": True,
        "user": {
            "name": claims.get("name", "Entra User"),
            "email": claims.get("email") or claims.get("preferred_username", ""),
            "role": claims.get("role", "User"),
            "roles": claims.get("roles", ["User.Read"]),
            "scopes": claims.get("scp", "").split(" ") if claims.get("scp") else [],
            "idp": claims.get("idp", "Microsoft Entra ID"),
        },
        "token_status": result.get("status")
    }


@router.post("/mock-login")
async def create_mock_session(payload: MockLoginRequest):
    """Generate mock user session token for instant testing."""
    email = payload.email or "superadmin@platform.com"
    role = payload.role or ("SuperAdmin" if "superadmin" in email.lower() else ("Admin" if "admin" in email.lower() else "User"))
    
    claims = {
        "sub": f"mock-sub-{hash(email) & 0xffffffff}",
        "name": payload.name or ("Global SuperAdmin" if role == "SuperAdmin" else ("Tenant Admin" if role == "Admin" else "Standard User")),
        "email": email,
        "role": role,
        "roles": [role, "User.Read"],
        "client_name": "Platform Enterprise" if role == "SuperAdmin" else "Acme Corporation",
        "idp": "Fiable SSO (Demo Mode)"
    }
    
    token = create_access_token(claims)
    return {
        "access_token": token,
        "token_type": "Bearer",
        "expires_in": 86400,
        "claims": claims
    }
