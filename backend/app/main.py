from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import init_db
from app.auth.routes import router as auth_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager to initialize DB tables on startup."""
    await init_db()
    yield


app = FastAPI(
    title="Fiable Multi-Client SSO API - Microsoft Entra ID",
    description="Multi-Client OIDC & SAML SSO Authentication API with SuperAdmin and RBAC roles",
    version="1.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Authentication & Multi-Client Router
app.include_router(auth_router)


@app.get("/health", tags=["System"])
async def health_check():
    return {
        "status": "healthy",
        "service": "Fiable Multi-Client SSO API",
        "entra_configured": settings.AZURE_CLIENT_ID != "your-entra-client-id-here",
        "mock_mode": settings.MOCK_AUTH_MODE,
        "Organizations_id": settings.AZURE_Organizations_ID,
    }


@app.get("/", tags=["System"])
async def root():
    return {
        "message": "Fiable Multi-Client SSO API Service",
        "docs": "/docs",
        "clients_endpoint": "/api/auth/clients",
        "resolve_endpoint": "/api/auth/clients/resolve?domain=acme.com"
    }
