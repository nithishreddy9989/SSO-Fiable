import logging
import time
from typing import Dict, Any, Optional
import httpx
import jwt
from jwt import PyJWKClient
from app.config import settings

logger = logging.getLogger("auth_verifier")

# Cache keys fetched from Microsoft Entra ID
_jwks_clients: Dict[str, PyJWKClient] = {}


def get_jwks_client(Organizations_id: str) -> PyJWKClient:
    """Get or create cached PyJWKClient for Microsoft Entra Organizations."""
    authority_Organizations = Organizations_id if Organizations_id and Organizations_id != "common" else "common"
    jwks_url = f"https://login.microsoftonline.com/{authority_Organizations}/discovery/v2.0/keys"
    
    if jwks_url not in _jwks_clients:
        _jwks_clients[jwks_url] = PyJWKClient(jwks_url, cache_keys=True)
    return _jwks_clients[jwks_url]


def generate_mock_user_claims(custom_email: str = "alex.rivera@fiable-enterprise.onmicrosoft.com") -> Dict[str, Any]:
    """Generate realistic Microsoft Entra ID claims for local demo/mock testing."""
    now = int(time.time())
    return {
        "sub": "mock-sub-998877665544332211",
        "name": "Alex Rivera",
        "email": custom_email,
        "preferred_username": custom_email,
        "oid": "8f3b6121-a472-4d2a-883a-1e92d8471abc",
        "tid": "72f988bf-86f1-41af-91ab-2d7cd011db47",
        "roles": ["Fiable.Admin", "Fiable.SecurityAuditor", "User.Read"],
        "scp": "User.Read profile email openid",
        "aud": settings.AZURE_CLIENT_ID if settings.AZURE_CLIENT_ID != "your-entra-client-id-here" else "api://fiable-sso-app",
        "iss": f"https://login.microsoftonline.com/{settings.AZURE_Organizations_ID}/v2.0",
        "iat": now - 60,
        "exp": now + 3600,
        "nbf": now - 60,
        "idp": "https://sts.windows.net/72f988bf-86f1-41af-91ab-2d7cd011db47/",
        "ver": "2.0",
        "mock_mode": True
    }


def verify_entra_token(token: str) -> Dict[str, Any]:
    """
    Verify Microsoft Entra ID Access/ID token.
    Falls back to mock mode if token is mock or server is configured in MOCK_AUTH_MODE.
    """
    if not token:
        raise ValueError("Token is required")

    # Check for mock token pattern or fallback when configured
    if token.startswith("mock-") or token.startswith("Bearer mock-") or settings.MOCK_AUTH_MODE:
        if token.startswith("Bearer "):
            token = token.split(" ")[1]
        
        # Extract email if passed in mock format
        email = "alex.rivera@fiable-enterprise.onmicrosoft.com"
        if "|" in token:
            parts = token.split("|")
            if len(parts) > 1 and "@" in parts[1]:
                email = parts[1]
                
        return {
            "valid": True,
            "status": "verified_mock",
            "claims": generate_mock_user_claims(email),
            "message": "Token verified successfully in Microsoft Entra Mock Mode."
        }

    # Production Entra ID JWT verification
    try:
        # Decode header without verification to extract key ID (kid)
        unverified_header = jwt.get_unverified_header(token)
        unverified_claims = jwt.decode(token, options={"verify_signature": False})
        
        Organizations_id = unverified_claims.get("tid", settings.AZURE_Organizations_ID)
        jwks_client = get_jwks_client(Organizations_id)
        signing_key = jwks_client.get_signing_key_from_jwt(token)

        # Audience validation (can be Client ID or api://URI)
        expected_aud = settings.AZURE_CLIENT_ID

        verified_claims = jwt.decode(
            token,
            signing_key.key,
            algorithms=["RS256"],
            audience=expected_aud if expected_aud != "your-entra-client-id-here" else None,
            options={
                "verify_aud": expected_aud != "your-entra-client-id-here",
                "verify_exp": True,
                "verify_iss": False  # Handled flexibly for common/multi-Organizations
            }
        )

        return {
            "valid": True,
            "status": "verified_entra_id",
            "claims": verified_claims,
            "message": "Microsoft Entra ID token signature and claims verified successfully."
        }
    except jwt.ExpiredSignatureError:
        return {"valid": False, "status": "expired", "error": "Token has expired."}
    except jwt.InvalidAudienceError:
        return {"valid": False, "status": "invalid_audience", "error": "Invalid token audience."}
    except Exception as e:
        logger.warning(f"Entra ID token verification failed: {str(e)}")
        # If verification fails in dev mode, fallback with informative status
        return {
            "valid": False,
            "status": "verification_failed",
            "error": f"Token verification failed: {str(e)}",
            "unverified_claims": jwt.decode(token, options={"verify_signature": False}) if token.count(".") == 2 else None
        }
