"""
CityEye — Database Abstraction Layer
Supports:
1. PostgreSQL (via asyncpg) for cloud deployment (Render, Supabase, Neon, Railway)
2. SQLite (via aiosqlite) for local development and offline resilience
"""
import os
import sys
import re
import asyncio
import random
from typing import Any, List, Optional, Tuple, Dict
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATABASE_URL = os.getenv("DATABASE_URL", "").strip()

# Default SQLite path (prioritize cityeye.db, fallback to urbanintel.db if present)
_default_sqlite = os.path.join(BASE_DIR, "cityeye.db")
if not os.path.exists(_default_sqlite) and os.path.exists(os.path.join(BASE_DIR, "urbanintel.db")):
    _default_sqlite = os.path.join(BASE_DIR, "urbanintel.db")

DB_PATH = os.getenv("SQLITE_DB_PATH", _default_sqlite)

# Detect backend engine
IS_POSTGRES = (
    DATABASE_URL.startswith("postgres://")
    or DATABASE_URL.startswith("postgresql://")
    or DATABASE_URL.startswith("postgresql+asyncpg://")
)

# Normalize postgres:// to postgresql:// for asyncpg
if IS_POSTGRES:
    if DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)
    elif DATABASE_URL.startswith("postgresql+asyncpg://"):
        DATABASE_URL = DATABASE_URL.replace("postgresql+asyncpg://", "postgresql://", 1)

_pg_pool = None

async def get_pg_pool():
    global _pg_pool
    if _pg_pool is None:
        import asyncpg
        _pg_pool = await asyncpg.create_pool(DATABASE_URL, min_size=1, max_size=10)
    return _pg_pool

async def close_db():
    """Cleanly close connection pools on app shutdown"""
    global _pg_pool
    if _pg_pool is not None:
        await _pg_pool.close()
        _pg_pool = None

def convert_placeholders(query: str) -> str:
    """Convert SQLite ? placeholders to PostgreSQL $1, $2, ... placeholders"""
    if not IS_POSTGRES:
        return query
    parts = query.split("?")
    if len(parts) == 1:
        return query
    new_query = []
    for idx, part in enumerate(parts[:-1]):
        new_query.append(f"{part}${idx + 1}")
    new_query.append(parts[-1])
    return "".join(new_query)

async def execute(query: str, params: tuple = ()):
    """Execute a query without expecting a return result"""
    if IS_POSTGRES:
        pool = await get_pg_pool()
        q = convert_placeholders(query)
        async with pool.acquire() as conn:
            await conn.execute(q, *params)
    else:
        import aiosqlite
        async with aiosqlite.connect(DB_PATH) as db:
            await db.execute(query, params)
            await db.commit()

async def execute_insert(query: str, params: tuple = (), id_column: str = "id") -> int:
    """Execute an INSERT and return the generated ID"""
    if IS_POSTGRES:
        pool = await get_pg_pool()
        q = convert_placeholders(query)
        if "RETURNING" not in q.upper():
            q = f"{q} RETURNING {id_column}"
        async with pool.acquire() as conn:
            row = await conn.fetchrow(q, *params)
            return row[id_column] if row else 0
    else:
        import aiosqlite
        async with aiosqlite.connect(DB_PATH) as db:
            cur = await db.execute(query, params)
            await db.commit()
            return cur.lastrowid

async def fetch_one(query: str, params: tuple = ()) -> Optional[Tuple]:
    """Fetch a single row as a tuple"""
    if IS_POSTGRES:
        pool = await get_pg_pool()
        q = convert_placeholders(query)
        async with pool.acquire() as conn:
            row = await conn.fetchrow(q, *params)
            return tuple(row.values()) if row else None
    else:
        import aiosqlite
        async with aiosqlite.connect(DB_PATH) as db:
            async with db.execute(query, params) as cur:
                return await cur.fetchone()

async def fetch_all(query: str, params: tuple = ()) -> List[Tuple]:
    """Fetch all matching rows as tuples"""
    if IS_POSTGRES:
        pool = await get_pg_pool()
        q = convert_placeholders(query)
        async with pool.acquire() as conn:
            rows = await conn.fetch(q, *params)
            return [tuple(r.values()) for r in rows]
    else:
        import aiosqlite
        async with aiosqlite.connect(DB_PATH) as db:
            async with db.execute(query, params) as cur:
                return await cur.fetchall()

# ─── Seed Data (Authentic Vidisha Municipal Telemetry with Real Photos) ──────────────
SEED_INCIDENTS = [
    ("Severe Road Crater / Pothole",    "High",   23.5240, 77.8115, "Ward 4",  "Madhav Ganj Main Market, Vidisha",  True,  "road", "real_pothole_mpnagar.jpg"),
    ("Commercial Solid Waste Overflow", "Medium", 23.5190, 77.8064, "Ward 7",  "Neemtal Commercial Area, Vidisha",   True,  "garbage", "real_garbage_bittan.jpg"),
    ("Transit Lane Severe Waterlogging","High",   23.5226, 77.8148, "Ward 12", "Station Road Underpass, Vidisha",    True,  "water", "real_waterlogging_newmarket.jpg"),
    ("Structural Pavement Subsidence",   "Medium", 23.5050, 77.7750, "Ward 2",  "Sanchi Road Highway Link, Vidisha", True,  "road", "incident_1788924070115.jpg"),
    ("Encroachment & Road Obstruction", "Low",    23.5170, 77.8171, "Ward 9",  "Durga Nagar Arterial, Vidisha",     True,  "encroachment", "incident_1788944092042.jpg"),
    ("Deep Road Surface Fracture",      "High",   23.5350, 77.8100, "Ward 14", "Ahmedpur Link Road, Vidisha",       True,  "road", "incident_1788922990402.jpg"),
]

TIMESTAMPS = [
    "2 mins ago", "5 mins ago", "11 mins ago", "18 mins ago",
    "32 mins ago", "41 mins ago", "1 hr ago", "1.5 hrs ago",
    "2 hrs ago", "3 hrs ago"
]

async def init_db(password_hasher=None):
    """Create tables and indexes for Incidents & Users and seed initial data if empty"""
    engine_name = "PostgreSQL" if IS_POSTGRES else "SQLite"
    print(f"[Database] Initializing ({engine_name})...")

    if IS_POSTGRES:
        create_incidents_sql = """
            CREATE TABLE IF NOT EXISTS incidents (
                id          SERIAL PRIMARY KEY,
                type        VARCHAR(100) NOT NULL,
                severity    VARCHAR(20) NOT NULL CHECK(severity IN ('High','Medium','Low')),
                lat         DOUBLE PRECISION NOT NULL,
                lng         DOUBLE PRECISION NOT NULL,
                ward        VARCHAR(50) NOT NULL,
                location    VARCHAR(150) NOT NULL,
                verified    INTEGER NOT NULL DEFAULT 0,
                resolved    INTEGER NOT NULL DEFAULT 0,
                category    VARCHAR(50) NOT NULL DEFAULT 'other',
                image_path  TEXT,
                confidence  DOUBLE PRECISION DEFAULT 0.0,
                bbox_x      DOUBLE PRECISION DEFAULT 20,
                bbox_y      DOUBLE PRECISION DEFAULT 20,
                bbox_w      DOUBLE PRECISION DEFAULT 60,
                bbox_h      DOUBLE PRECISION DEFAULT 50,
                created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
                timestamp_label VARCHAR(50) NOT NULL DEFAULT 'Just now'
            );
        """
        create_users_sql = """
            CREATE TABLE IF NOT EXISTS users (
                id       SERIAL PRIMARY KEY,
                username VARCHAR(100) NOT NULL UNIQUE,
                password TEXT NOT NULL,
                name     VARCHAR(150) NOT NULL,
                role     VARCHAR(50) NOT NULL DEFAULT 'field_agent' CHECK(role IN ('admin','field_agent'))
            );
        """
    else:
        create_incidents_sql = """
            CREATE TABLE IF NOT EXISTS incidents (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                type        TEXT NOT NULL,
                severity    TEXT NOT NULL CHECK(severity IN ('High','Medium','Low')),
                lat         REAL NOT NULL,
                lng         REAL NOT NULL,
                ward        TEXT NOT NULL,
                location    TEXT NOT NULL,
                verified    INTEGER NOT NULL DEFAULT 0,
                resolved    INTEGER NOT NULL DEFAULT 0,
                category    TEXT NOT NULL DEFAULT 'other',
                image_path  TEXT,
                confidence  REAL DEFAULT 0.0,
                bbox_x      REAL DEFAULT 20,
                bbox_y      REAL DEFAULT 20,
                bbox_w      REAL DEFAULT 60,
                bbox_h      REAL DEFAULT 50,
                created_at  TEXT NOT NULL DEFAULT (datetime('now','localtime')),
                timestamp_label TEXT NOT NULL DEFAULT 'Just now'
            );
        """
        create_users_sql = """
            CREATE TABLE IF NOT EXISTS users (
                id       INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT NOT NULL UNIQUE,
                password TEXT NOT NULL,
                name     TEXT NOT NULL,
                role     TEXT NOT NULL DEFAULT 'field_agent' CHECK(role IN ('admin','field_agent'))
            );
        """

    if IS_POSTGRES:
        create_work_orders_sql = """
            CREATE TABLE IF NOT EXISTS work_orders (
                id              SERIAL PRIMARY KEY,
                incident_id     INTEGER NOT NULL,
                contractor_name VARCHAR(150) NOT NULL,
                zone            VARCHAR(100) NOT NULL,
                priority        VARCHAR(20) NOT NULL,
                sla_hours       INTEGER NOT NULL DEFAULT 24,
                deadline        VARCHAR(100) NOT NULL,
                status          VARCHAR(50) NOT NULL DEFAULT 'Dispatched',
                notes           TEXT,
                created_at      TIMESTAMP NOT NULL DEFAULT NOW()
            );
        """
    else:
        create_work_orders_sql = """
            CREATE TABLE IF NOT EXISTS work_orders (
                id              INTEGER PRIMARY KEY AUTOINCREMENT,
                incident_id     INTEGER NOT NULL,
                contractor_name TEXT NOT NULL,
                zone            TEXT NOT NULL,
                priority        TEXT NOT NULL,
                sla_hours       INTEGER NOT NULL DEFAULT 24,
                deadline        TEXT NOT NULL,
                status          TEXT NOT NULL DEFAULT 'Dispatched',
                notes           TEXT,
                created_at      TEXT NOT NULL DEFAULT (datetime('now','localtime'))
            );
        """

    await execute(create_incidents_sql)
    await execute(create_users_sql)
    await execute(create_work_orders_sql)

    # Safe column additions if not already present
    for col_sql in [
        "ALTER TABLE incidents ADD COLUMN dispatched_to TEXT",
        "ALTER TABLE incidents ADD COLUMN sla_deadline TEXT",
        "ALTER TABLE incidents ADD COLUMN dispatch_notes TEXT",
        "ALTER TABLE incidents ADD COLUMN after_image_path TEXT",
        "ALTER TABLE incidents ADD COLUMN repair_score REAL",
        "ALTER TABLE work_orders ADD COLUMN after_image_path TEXT",
        "ALTER TABLE work_orders ADD COLUMN repair_score REAL",
        "ALTER TABLE work_orders ADD COLUMN verified_at TEXT"
    ]:
        try:
            await execute(col_sql)
        except Exception:
            pass

    # Create indexes for high-speed lookups and filtering
    index_sqls = [
        "CREATE INDEX IF NOT EXISTS idx_incidents_ward ON incidents(ward);",
        "CREATE INDEX IF NOT EXISTS idx_incidents_severity ON incidents(severity);",
        "CREATE INDEX IF NOT EXISTS idx_incidents_resolved ON incidents(resolved);",
        "CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);",
        "CREATE INDEX IF NOT EXISTS idx_work_orders_incident ON work_orders(incident_id);"
    ]
    for idx_sql in index_sqls:
        try:
            await execute(idx_sql)
        except Exception:
            pass

    # Seed incidents if empty
    row = await fetch_one("SELECT COUNT(*) FROM incidents")
    count = row[0] if row else 0

    if count == 0:
        print("[Database] Seeding initial incidents...")
        for i, (t, s, lat, lng, ward, loc, verified, cat, img) in enumerate(SEED_INCIDENTS):
            await execute("""
                INSERT INTO incidents
                    (type, severity, lat, lng, ward, location, verified, category,
                     image_path, confidence, bbox_x, bbox_y, bbox_w, bbox_h, timestamp_label)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                t, s, lat, lng, ward, loc, 1 if verified else 0, cat,
                img,
                round(random.uniform(0.85, 0.98), 2),
                round(random.uniform(15, 30), 1),
                round(random.uniform(15, 30), 1),
                round(random.uniform(40, 65), 1),
                round(random.uniform(35, 55), 1),
                TIMESTAMPS[i]
            ))
        print("[Database] Incidents seeded successfully.")

    # Seed demo users if empty
    user_row = await fetch_one("SELECT COUNT(*) FROM users")
    user_count = user_row[0] if user_row else 0
    if user_count == 0 and password_hasher:
        print("[Database] Seeding default users (admin & field_agent)...")
        await execute(
            "INSERT INTO users (username, password, name, role) VALUES (?, ?, ?, ?)",
            ("admin", password_hasher("admin123"), "Command Center Admin", "admin")
        )
        await execute(
            "INSERT INTO users (username, password, name, role) VALUES (?, ?, ?, ?)",
            ("agent", password_hasher("agent123"), "Field Agent 01", "field_agent")
        )
        print("[Database] Default users created: admin/admin123, agent/agent123")

async def get_db_health() -> Dict[str, Any]:
    """Returns database health metrics for telemetry"""
    engine_name = "PostgreSQL" if IS_POSTGRES else "SQLite"
    try:
        incidents_res = await fetch_one("SELECT COUNT(*) FROM incidents")
        users_res = await fetch_one("SELECT COUNT(*) FROM users")
        return {
            "status": "connected",
            "engine": engine_name,
            "incidents_count": incidents_res[0] if incidents_res else 0,
            "users_count": users_res[0] if users_res else 0,
            "details": f"Database healthy running on {engine_name}"
        }
    except Exception as e:
        return {
            "status": "error",
            "engine": engine_name,
            "error": str(e)
        }
