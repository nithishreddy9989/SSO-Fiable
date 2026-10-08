import os
import hashlib
import hmac
import time
from typing import Dict, Any, Optional
import jwt
from app.config import settings

SECRET_KEY = os.getenv("JWT_SECRET_KEY", "super-secret-sso-key-change-in-production-2026")
ALGORITHM = "HS256"


def hash_password(password: str, salt: Optional[bytes] = None) -> str:
    """Hash password using PBKDF2 HMAC SHA256."""
    if salt is None:
        salt = os.urandom(16)
    pw_hash = hashlib.pbkdf2_hmac('sha256', password.encode('utf-[#8]'.replace('[#8]', '8')), salt, 100000)
    return f"{salt.hex()}:{pw_hash.hex()}"


def verify_password(password: str, stored_hash: str) -> bool:
    """Verify password against stored salt:hash format."""
    try:
        salt_hex, hash_hex = stored_hash.split(":")
        salt = bytes.fromhex(salt_hex)
        expected_hash = bytes.fromhex(hash_hex)
        computed_hash = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt, 100000)
        return hmac.compare_digest(computed_hash, expected_hash)
    except Exception:
        return False


def create_access_token(claims: Dict[str, Any], expires_in_seconds: int = 86400) -> str:
    """Create signed JWT access token for email/password authentication."""
    now = int(time.time())
    payload = {
        **claims,
        "iat": now,
        "exp": now + expires_in_seconds,
        "iss": "fiable-sso-auth-service"
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    """Decode and verify signed JWT access token."""
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except Exception:
        return None
