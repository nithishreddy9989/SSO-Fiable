from typing import Optional, List, Callable
from fastapi import Header, HTTPException, Depends, status
from app.auth.verifier import verify_entra_token, generate_mock_user_claims
from app.config import settings


async def get_current_user(authorization: Optional[str] = Header(None)) -> dict:
    """
    Reusable FastAPI dependency to extract and verify Microsoft Entra ID user identity.
    Use in any FastAPI route: `user: dict = Depends(get_current_user)`
    """
    if not authorization or not authorization.startswith("Bearer "):
        if settings.MOCK_AUTH_MODE:
            return generate_mock_user_claims()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid Bearer authorization header",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = authorization.split(" ")[1]
    result = verify_entra_token(token)

    if not result.get("valid"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=result.get("error", "Invalid Microsoft Entra ID token"),
            headers={"WWW-Authenticate": "Bearer"},
        )

    return result.get("claims", {})


def require_roles(required_roles: List[str]) -> Callable:
    """
    Reusable role-based access control (RBAC) dependency generator for FastAPI.
    Example usage on any endpoint:
    `@app.get("/admin", dependencies=[Depends(require_roles(["Admin", "SecurityAuditor"]))])`
    """
    async def role_checker(user: dict = Depends(get_current_user)):
        user_roles = user.get("roles", [])
        has_role = any(role in user_roles for role in required_roles)
        
        if not has_role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Requires one of roles: {required_roles}"
            )
        return user

    return role_checker
