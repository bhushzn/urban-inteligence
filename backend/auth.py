"""
CityEye AI — Authentication Module
JWT-based auth with role-based access control (RBAC)
Compatible with both PostgreSQL and SQLite
"""
import os
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import database

# ─── Configuration ──────────────────────────────────────────────────────────
SECRET_KEY = os.getenv("JWT_SECRET", "cityeye-sih-2024-super-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))  # 24 hours

# ─── Password Hashing ──────────────────────────────────────────────────────
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer(auto_error=False)

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

# ─── JWT Token ──────────────────────────────────────────────────────────────
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def decode_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
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
