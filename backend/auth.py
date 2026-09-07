"""
UrbanIntel AI — Authentication Module
JWT-based auth with role-based access control
"""
import os
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import aiosqlite

# ─── Configuration ──────────────────────────────────────────────────────────
SECRET_KEY = os.getenv("JWT_SECRET", "urbanintel-sih-2024-super-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours

DB_PATH = "urbanintel.db"

# ─── Password Hashing ──────────────────────────────────────────────────────
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer(auto_error=False)

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

# ─── JWT Token ──────────────────────────────────────────────────────────────
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def decode_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None

# ─── Database Init ──────────────────────────────────────────────────────────
async def init_users_db():
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id       INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT NOT NULL UNIQUE,
                password TEXT NOT NULL,
                name     TEXT NOT NULL,
                role     TEXT NOT NULL DEFAULT 'field_agent' CHECK(role IN ('admin','field_agent'))
            )
        """)
        await db.commit()

        # Seed default users if empty
        async with db.execute("SELECT COUNT(*) FROM users") as cur:
            count = (await cur.fetchone())[0]

        if count == 0:
            # Default admin account
            await db.execute(
                "INSERT INTO users (username, password, name, role) VALUES (?, ?, ?, ?)",
                ("admin", hash_password("admin123"), "Command Center Admin", "admin")
            )
            # Default field agent
            await db.execute(
                "INSERT INTO users (username, password, name, role) VALUES (?, ?, ?, ?)",
                ("agent", hash_password("agent123"), "Field Agent 01", "field_agent")
            )
            await db.commit()
            print("✅ Default users created: admin/admin123, agent/agent123")

# ─── Auth Dependency ────────────────────────────────────────────────────────
async def get_current_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)):
    """Extract and validate current user from JWT token. Returns None if no token."""
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
    """Require admin role — raises 403 if not admin"""
    if not credentials:
        raise HTTPException(status_code=401, detail="Authentication required")
    payload = decode_token(credentials.credentials)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    if payload.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return payload

async def require_auth(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Require any authenticated user"""
    if not credentials:
        raise HTTPException(status_code=401, detail="Authentication required")
    payload = decode_token(credentials.credentials)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    return payload
