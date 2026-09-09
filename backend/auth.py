"""
CityEye AI — Authentication Module
JWT-based auth with role-based access control (RBAC)
Compatible with both PostgreSQL and SQLite
"""
import os
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
import hmac
import hashlib
import json
import base64

try:
    from jose import JWTError, jwt
    USE_JOSE = True
except ImportError:
    try:
        import jwt
        JWTError = Exception
        USE_JOSE = False
    except ImportError:
        JWTError = Exception
        jwt = None

try:
    from passlib.context import CryptContext
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
except ImportError:
    pwd_context = None

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import database

# ─── Configuration ──────────────────────────────────────────────────────────
SECRET_KEY = os.getenv("JWT_SECRET", "cityeye-sih-2024-super-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))  # 24 hours

security = HTTPBearer(auto_error=False)

def hash_password(password: str) -> str:
    if pwd_context:
        return pwd_context.hash(password)
    # Built-in secure PBKDF2 fallback
    salt = os.urandom(16).hex()
    dk = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 100000)
    return f"pbkdf2:{salt}:{dk.hex()}"

def verify_password(plain: str, hashed: str) -> bool:
    if hashed.startswith("pbkdf2:"):
        parts = hashed.split(":")
        if len(parts) == 3:
            salt = parts[1]
            expected = parts[2]
            dk = hashlib.pbkdf2_hmac("sha256", plain.encode(), salt.encode(), 100000)
            return hmac.compare_digest(dk.hex(), expected)
    if pwd_context:
        try:
            return pwd_context.verify(plain, hashed)
        except Exception:
            return False
    return False

def _b64_url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).decode().rstrip("=")

def _b64_url_decode(s: str) -> bytes:
    padding = "=" * ((4 - len(s) % 4) % 4)
    return base64.urlsafe_b64decode(s + padding)

# ─── JWT Token ──────────────────────────────────────────────────────────────
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": int(expire.timestamp())})
    
    if jwt is not None:
        return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    
    # Pure Python standard library JWT HS256 implementation
    header = {"typ": "JWT", "alg": "HS256"}
    h_b64 = _b64_url_encode(json.dumps(header, separators=(",", ":")).encode())
    p_b64 = _b64_url_encode(json.dumps(to_encode, separators=(",", ":")).encode())
    signing_input = f"{h_b64}.{p_b64}".encode()
    sig = hmac.new(SECRET_KEY.encode(), signing_input, hashlib.sha256).digest()
    sig_b64 = _b64_url_encode(sig)
    return f"{h_b64}.{p_b64}.{sig_b64}"

def decode_token(token: str) -> Optional[dict]:
    if not token or not isinstance(token, str):
        return None
    if jwt is not None:
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            return payload
        except Exception:
            pass

    try:
        parts = token.split(".")
        if len(parts) != 3:
            return None
        h_b64, p_b64, sig_b64 = parts
        signing_input = f"{h_b64}.{p_b64}".encode()
        expected_sig = hmac.new(SECRET_KEY.encode(), signing_input, hashlib.sha256).digest()
        actual_sig = _b64_url_decode(sig_b64)
        if not hmac.compare_digest(expected_sig, actual_sig):
            return None
        payload_bytes = _b64_url_decode(p_b64)
        payload = json.loads(payload_bytes.decode())
        exp = payload.get("exp")
        if exp and isinstance(exp, (int, float)):
            if datetime.utcnow().timestamp() > exp:
                return None
        return payload
    except Exception:
        return None

# ─── User Queries ───────────────────────────────────────────────────────────
async def get_user_by_username(username: str) -> Optional[Dict[str, Any]]:
    row = await database.fetch_one(
        "SELECT id, username, password, name, role FROM users WHERE username = ?",
        (username.strip(),)
    )
    if not row:
        return None
    return {
        "id": row[0],
        "username": row[1],
        "password": row[2],
        "name": row[3],
        "role": row[4]
    }

async def create_user(username: str, plain_password: str, name: str, role: str = "field_agent") -> int:
    hashed = hash_password(plain_password)
    user_id = await database.execute_insert(
        "INSERT INTO users (username, password, name, role) VALUES (?, ?, ?, ?)",
        (username.strip(), hashed, name.strip(), role),
        id_column="id"
    )
    return user_id

# ─── Auth Dependencies ──────────────────────────────────────────────────────
async def get_current_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)):
    """Extract and validate current user from JWT token. Returns None if unauthenticated."""
    if not credentials:
        return None
    payload = decode_token(credentials.credentials)
    if not payload:
        return None
    return {
        "id": payload.get("user_id"),
        "username": payload.get("username"),
        "name": payload.get("name"),
        "role": payload.get("role"),
    }

async def require_admin(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Require admin role — raises 403 if not admin or 401 if unauthenticated"""
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please sign in as Command Center Admin."
        )
    payload = decode_token(credentials.credentials)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token. Please sign in again."
        )
    if payload.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Only Command Center Admins have permission to perform this action."
        )
    return payload

async def require_auth(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Require any authenticated user (admin or field_agent)"""
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please sign in."
        )
    payload = decode_token(credentials.credentials)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token. Please sign in again."
        )
    return payload
