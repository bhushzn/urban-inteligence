"""
UrbanIntel AI — FastAPI Backend
Real-time Smart City Command Center API
"""
import asyncio
import json
import os
import random
import base64
import time
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, UploadFile, File, Form, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import aiosqlite
from ultralytics import YOLO
import cv2
import numpy as np
from auth import (
    init_users_db, get_current_user, require_admin, require_auth,
    hash_password, verify_password, create_access_token
)

# ─── App Setup ──────────────────────────────────────────────────────────────
app = FastAPI(title="UrbanIntel AI API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_PATH = "urbanintel.db"
UPLOADS_DIR = "uploads"
os.makedirs(UPLOADS_DIR, exist_ok=True)

# Serve uploaded images
app.mount("/uploads", StaticFiles(directory=UPLOADS_DIR), name="uploads")

# ─── WebSocket Connection Manager ───────────────────────────────────────────
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, data: dict):
        msg = json.dumps(data)
        dead = []
        for conn in self.active_connections:
            try:
                await conn.send_text(msg)
            except Exception:
                dead.append(conn)
        for d in dead:
            self.disconnect(d)

manager = ConnectionManager()

# ─── Database Init ──────────────────────────────────────────────────────────
SEED_INCIDENTS = [
    ("Pothole Detected",    "High",   23.8300, 77.7900, "Ward 7",  "Bhopal, MP",           False, "road"),
    ("Unauthorized Dumping","High",   23.8412, 77.7654, "Ward 12", "Ayodhya Bypass",        False, "garbage"),
    ("Waterlogging",        "Medium", 23.8190, 77.8010, "Ward 3",  "New Market Road",        True,  "water"),
    ("Broken Streetlight",  "Medium", 23.8522, 77.7820, "Ward 15", "Arera Colony",           False, "infrastructure"),
    ("Encroachment",        "Low",    23.8088, 77.7730, "Ward 5",  "Habibganj Naka",         True,  "encroachment"),
    ("Pothole Detected",    "High",   23.8355, 77.7980, "Ward 9",  "Roshanpura Sq.",         False, "road"),
    ("Stray Animal Hazard", "Low",    23.8270, 77.7600, "Ward 2",  "MP Nagar Zone",          True,  "animal"),
    ("Illegal Hoarding",    "Low",    23.8450, 77.7890, "Ward 18", "TT Nagar Circle",        False, "encroachment"),
    ("Open Manhole",        "High",   23.8315, 77.7720, "Ward 7",  "Shivaji Nagar",          False, "road"),
    ("Garbage Overflow",    "Medium", 23.8230, 77.8050, "Ward 3",  "Patel Nagar",            False, "garbage"),
]

TIMESTAMPS = [
    "2 mins ago", "5 mins ago", "11 mins ago", "18 mins ago",
    "32 mins ago", "41 mins ago", "1 hr ago", "1.5 hrs ago",
    "2 hrs ago", "3 hrs ago"
]

async def init_db():
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("""
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
            )
        """)
        await db.commit()

        # Seed data if empty
        async with db.execute("SELECT COUNT(*) FROM incidents") as cur:
            count = (await cur.fetchone())[0]

        if count == 0:
            for i, (t, s, lat, lng, ward, loc, verified, cat) in enumerate(SEED_INCIDENTS):
                await db.execute("""
                    INSERT INTO incidents
                        (type, severity, lat, lng, ward, location, verified, category,
                         confidence, bbox_x, bbox_y, bbox_w, bbox_h, timestamp_label)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    t, s, lat, lng, ward, loc, 1 if verified else 0, cat,
                    round(random.uniform(0.65, 0.97), 2),
                    round(random.uniform(15, 30), 1),
                    round(random.uniform(15, 30), 1),
                    round(random.uniform(40, 65), 1),
                    round(random.uniform(35, 55), 1),
                    TIMESTAMPS[i]
                ))
            await db.commit()

@app.on_event("startup")
async def startup():
    global yolo_model
    try:
        yolo_model = YOLO('yolov8n.pt')  # Download and load the Nano model
        print("✅ YOLOv8 model loaded successfully.")
    except Exception as e:
        print(f"⚠️ Failed to load YOLOv8 model: {e}")
        yolo_model = None
    
    await init_db()
    await init_users_db()
    asyncio.create_task(auto_incident_generator())

# ─── Helper ─────────────────────────────────────────────────────────────────
def incident_row_to_dict(row):
    keys = ["id", "type", "severity", "lat", "lng", "ward", "location",
            "verified", "resolved", "category", "image_path", "confidence",
            "bbox_x", "bbox_y", "bbox_w", "bbox_h", "created_at", "timestamp_label"]
    d = dict(zip(keys, row))
    d["verified"] = bool(d["verified"])
    d["resolved"] = bool(d["resolved"])
    d["image_url"] = f"/uploads/{d['image_path']}" if d["image_path"] else None
    return d

# ─── AI Detector (Real YOLOv8) ──────────────────────────────────────────────
yolo_model = None

ANOMALY_CLASSES = {
    "road":          [("Pothole Detected", "High"), ("Road Crack", "Medium"), ("Speed Breaker Damage", "Low")],
    "garbage":       [("Unauthorized Dumping", "High"), ("Garbage Overflow", "Medium"), ("Littering", "Low")],
    "water":         [("Waterlogging", "Medium"), ("Drain Overflow", "High"), ("Broken Pipeline", "High")],
    "infrastructure":[("Broken Streetlight", "Medium"), ("Damaged Sign", "Low"), ("Broken Footpath", "Medium")],
    "encroachment":  [("Encroachment", "Low"), ("Illegal Hoarding", "Low"), ("Unauthorized Parking", "Low")],
    "animal":        [("Stray Animal Hazard", "Low"), ("Animal Carcass", "High")],
}

def run_yolo_inference(image_bytes: bytes, category: str) -> dict:
    start_time = time.time()
    
    # Fallback to mock if model didn't load
    if not yolo_model:
        options = ANOMALY_CLASSES.get(category, ANOMALY_CLASSES["road"])
        detected_type, severity = random.choice(options)
        return {
            "type": detected_type,
            "severity": severity,
            "confidence": round(random.uniform(0.72, 0.98), 2),
            "bbox": {"x": 20, "y": 20, "w": 60, "h": 50},
            "model": "Mock-YOLOv8",
            "processing_time_ms": int((time.time() - start_time) * 1000)
        }

    try:
        # Convert image bytes to OpenCV format
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        height, width, _ = img.shape

        # Run inference
        results = yolo_model(img)
        
        best_box = None
        best_conf = 0.0
        best_class_name = "Unknown"
        
        for result in results:
            boxes = result.boxes
            for box in boxes:
                conf = float(box.conf[0])
                if conf > best_conf:
                    best_conf = conf
                    best_box = box.xywh[0] # x_center, y_center, width, height
                    best_class_name = result.names[int(box.cls[0])]

        if best_box is not None:
            # Convert absolute pixels to percentages
            x_c, y_c, w_px, h_px = best_box.tolist()
            # Calculate top-left corner
            tl_x = x_c - (w_px / 2)
            tl_y = y_c - (h_px / 2)
            
            bbox = {
                "x": round((tl_x / width) * 100, 1),
                "y": round((tl_y / height) * 100, 1),
                "w": round((w_px / width) * 100, 1),
                "h": round((h_px / height) * 100, 1),
            }
            # For this prototype, we'll map the generic YOLO class (e.g. 'car', 'person') 
            # to our SIH categories, or just use the class name directly
            detected_type = f"{best_class_name.capitalize()} Detected"
            severity = "High" if best_conf > 0.8 else "Medium"
        else:
            # No object detected, return a default/fallback
            bbox = {"x": 10, "y": 10, "w": 80, "h": 80}
            detected_type = "Unidentified Anomaly"
            severity = "Low"
            best_conf = 0.5
            
        return {
            "type": detected_type,
            "severity": severity,
            "confidence": round(best_conf, 2),
            "bbox": bbox,
            "model": "YOLOv8n (Real)",
            "processing_time_ms": int((time.time() - start_time) * 1000)
        }
    except Exception as e:
        print(f"Inference error: {e}")
        return {
            "type": "Error Detected",
            "severity": "Low",
            "confidence": 0.0,
            "bbox": {"x": 0, "y": 0, "w": 100, "h": 100},
            "model": "Error",
            "processing_time_ms": int((time.time() - start_time) * 1000)
        }

# ─── Auto Incident Generator (simulates live field reports) ─────────────────
AUTO_INCIDENTS = [
    ("Pothole Detected", "High", 23.8291, 77.7945, "Ward 6", "Kolar Road"),
    ("Garbage Overflow", "Medium", 23.8380, 77.7810, "Ward 11", "Bittan Market"),
    ("Waterlogging", "High", 23.8155, 77.7895, "Ward 4", "Misrod Area"),
    ("Broken Streetlight", "Low", 23.8478, 77.7755, "Ward 14", "Bairagarh"),
    ("Encroachment", "Medium", 23.8330, 77.7680, "Ward 8", "Hoshangabad Road"),
]

async def auto_incident_generator():
    """Simulate new incidents arriving every 30 seconds"""
    await asyncio.sleep(30)
    while True:
        t, s, lat, lng, ward, loc = random.choice(AUTO_INCIDENTS)
        cat = "road" if "Pothole" in t else "garbage" if "Garbage" in t else "water" if "Water" in t else "infrastructure"
        async with aiosqlite.connect(DB_PATH) as db:
            cur = await db.execute("""
                INSERT INTO incidents
                    (type, severity, lat, lng, ward, location, verified, category,
                     confidence, bbox_x, bbox_y, bbox_w, bbox_h, timestamp_label)
                VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, 'Just now')
            """, (t, s, lat, lng, ward, loc, cat,
                  round(random.uniform(0.72, 0.97), 2),
                  round(random.uniform(15, 28), 1),
                  round(random.uniform(15, 28), 1),
                  round(random.uniform(45, 65), 1),
                  round(random.uniform(35, 52), 1)))
            await db.commit()
            inc_id = cur.lastrowid
            async with db.execute("SELECT * FROM incidents WHERE id=?", (inc_id,)) as c:
                row = await c.fetchone()
        if row:
            await manager.broadcast({"event": "new_incident", "data": incident_row_to_dict(row)})
        await asyncio.sleep(random.randint(25, 45))

# ─── Auth Models & Routes ───────────────────────────────────────────────────
class LoginRequest(BaseModel):
    username: str
    password: str

class RegisterRequest(BaseModel):
    username: str
    password: str
    name: str
    role: Optional[str] = "field_agent"

@app.post("/api/auth/login")
async def login(req: LoginRequest):
    async with aiosqlite.connect(DB_PATH) as db:
        async with db.execute("SELECT id, username, password, name, role FROM users WHERE username = ?", (req.username.strip(),)) as cur:
            user = await cur.fetchone()
    
    if not user or not verify_password(req.password, user[2]):
        raise HTTPException(status_code=401, detail="Invalid username or password")
    
    token_data = {
        "user_id": user[0],
        "username": user[1],
        "name": user[3],
        "role": user[4]
    }
    token = create_access_token(token_data)
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user[0],
            "username": user[1],
            "name": user[3],
            "role": user[4]
        }
    }

@app.post("/api/auth/register")
async def register(req: RegisterRequest):
    if len(req.username.strip()) < 3 or len(req.password) < 4:
        raise HTTPException(status_code=400, detail="Username and password must be at least 3 and 4 characters.")
    
    role = req.role if req.role in ("admin", "field_agent") else "field_agent"
    hashed = hash_password(req.password)
    
    try:
        async with aiosqlite.connect(DB_PATH) as db:
            cur = await db.execute(
                "INSERT INTO users (username, password, name, role) VALUES (?, ?, ?, ?)",
                (req.username.strip(), hashed, req.name.strip(), role)
            )
            await db.commit()
            user_id = cur.lastrowid
    except aiosqlite.IntegrityError:
        raise HTTPException(status_code=400, detail="Username already exists")
        
    token_data = {
        "user_id": user_id,
        "username": req.username.strip(),
        "name": req.name.strip(),
        "role": role
    }
    token = create_access_token(token_data)
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user_id,
            "username": req.username.strip(),
            "name": req.name.strip(),
            "role": role
        }
    }

@app.get("/api/auth/me")
async def get_me(user = Depends(get_current_user)):
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return {"user": user}

# ─── Routes ─────────────────────────────────────────────────────────────────

@app.get("/api/health")
async def health():
    return {"status": "ok", "service": "UrbanIntel AI Backend", "time": datetime.now().isoformat()}

@app.get("/api/incidents")
async def get_incidents(ward: Optional[str] = None, severity: Optional[str] = None,
                        resolved: Optional[bool] = None):
    query = "SELECT * FROM incidents WHERE 1=1"
    params = []
    if ward:
        query += " AND ward=?"
        params.append(ward)
    if severity:
        query += " AND severity=?"
        params.append(severity)
    if resolved is not None:
        query += " AND resolved=?"
        params.append(1 if resolved else 0)
    query += " ORDER BY id DESC"

    async with aiosqlite.connect(DB_PATH) as db:
        async with db.execute(query, params) as cur:
            rows = await cur.fetchall()
    return [incident_row_to_dict(r) for r in rows]

@app.get("/api/incidents/{inc_id}")
async def get_incident(inc_id: int):
    async with aiosqlite.connect(DB_PATH) as db:
        async with db.execute("SELECT * FROM incidents WHERE id=?", (inc_id,)) as cur:
            row = await cur.fetchone()
    if not row:
        raise HTTPException(404, "Incident not found")
    return incident_row_to_dict(row)

@app.post("/api/incidents")
async def create_incident(
    type: str = Form(...),
    severity: str = Form(...),
    lat: float = Form(...),
    lng: float = Form(...),
    ward: str = Form(...),
    location: str = Form(...),
    category: str = Form("road"),
    image: Optional[UploadFile] = File(None),
):
    image_path = None
    confidence = 0.0
    bbox_x, bbox_y, bbox_w, bbox_h = 20.0, 20.0, 60.0, 50.0

    if image and image.filename:
        ext = os.path.splitext(image.filename)[1] or ".jpg"
        fname = f"incident_{int(time.time()*1000)}{ext}"
        fpath = os.path.join(UPLOADS_DIR, fname)
        content = await image.read()
        with open(fpath, "wb") as f:
            f.write(content)
        image_path = fname
        # Run real YOLO detection
        result = run_yolo_inference(content, category)
        detected_type = result["type"]
        confidence = result["confidence"]
        bbox_x = result["bbox"]["x"]
        bbox_y = result["bbox"]["y"]
        bbox_w = result["bbox"]["w"]
        bbox_h = result["bbox"]["h"]
        
        # Override the form's provided type if the AI detected something
        if confidence > 0.1:
            type = detected_type
            severity = result["severity"]

    async with aiosqlite.connect(DB_PATH) as db:
        cur = await db.execute("""
            INSERT INTO incidents
                (type, severity, lat, lng, ward, location, category,
                 image_path, confidence, bbox_x, bbox_y, bbox_w, bbox_h, timestamp_label)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Just now')
        """, (type, severity, lat, lng, ward, location, category,
              image_path, confidence, bbox_x, bbox_y, bbox_w, bbox_h))
        await db.commit()
        inc_id = cur.lastrowid
        async with db.execute("SELECT * FROM incidents WHERE id=?", (inc_id,)) as c:
            row = await c.fetchone()

    inc = incident_row_to_dict(row)
    await manager.broadcast({"event": "new_incident", "data": inc})
    return inc

@app.patch("/api/incidents/{inc_id}/verify")
async def verify_incident(inc_id: int):
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("UPDATE incidents SET verified=1 WHERE id=?", (inc_id,))
        await db.commit()
        async with db.execute("SELECT * FROM incidents WHERE id=?", (inc_id,)) as cur:
            row = await cur.fetchone()
    if not row:
        raise HTTPException(404, "Incident not found")
    inc = incident_row_to_dict(row)
    await manager.broadcast({"event": "incident_updated", "data": inc})
    return inc

@app.patch("/api/incidents/{inc_id}/resolve")
async def resolve_incident(inc_id: int):
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("UPDATE incidents SET resolved=1, verified=1 WHERE id=?", (inc_id,))
        await db.commit()
        async with db.execute("SELECT * FROM incidents WHERE id=?", (inc_id,)) as cur:
            row = await cur.fetchone()
    if not row:
        raise HTTPException(404, "Incident not found")
    inc = incident_row_to_dict(row)
    await manager.broadcast({"event": "incident_updated", "data": inc})
    return inc

@app.post("/api/analyze")
async def analyze_image(
    category: str = Form("road"),
    image: UploadFile = File(...)
):
    """Run real YOLO detection on uploaded image for preview"""
    content = await image.read()
    result = run_yolo_inference(content, category)
    return result

@app.get("/api/analytics")
async def get_analytics():
    async with aiosqlite.connect(DB_PATH) as db:
        # Total counts
        async with db.execute("SELECT COUNT(*) FROM incidents") as cur:
            total = (await cur.fetchone())[0]
        async with db.execute("SELECT COUNT(*) FROM incidents WHERE resolved=1") as cur:
            resolved = (await cur.fetchone())[0]
        async with db.execute("SELECT COUNT(*) FROM incidents WHERE verified=1 AND resolved=0") as cur:
            verified = (await cur.fetchone())[0]
        async with db.execute("SELECT COUNT(*) FROM incidents WHERE severity='High' AND resolved=0") as cur:
            critical = (await cur.fetchone())[0]

        # By ward
        async with db.execute("""
            SELECT ward, COUNT(*) as cnt FROM incidents
            GROUP BY ward ORDER BY cnt DESC LIMIT 8
        """) as cur:
            ward_data = [{"ward": r[0], "count": r[1]} for r in await cur.fetchall()]

        # By category
        async with db.execute("""
            SELECT category, COUNT(*) as cnt FROM incidents
            GROUP BY category ORDER BY cnt DESC
        """) as cur:
            cat_data = [{"category": r[0], "count": r[1]} for r in await cur.fetchall()]

        # Active buses (mock — tied to total incidents for realism)
        active_buses = 24 + (total // 5)

    return {
        "total": total,
        "resolved": resolved,
        "verified": verified,
        "critical": critical,
        "pending": total - resolved,
        "resolution_rate": round((resolved / total * 100) if total else 0, 1),
        "active_buses": min(active_buses, 48),
        "fleet_health": 98,
        "ward_breakdown": ward_data,
        "category_breakdown": cat_data,
    }

# ─── WebSocket ──────────────────────────────────────────────────────────────
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()  # Keep alive
    except WebSocketDisconnect:
        manager.disconnect(websocket)
