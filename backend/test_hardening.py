"""
Verification test for Phase 4 Backend Hardening
Tests:
1. Dual-engine Database (SQLite/Postgres) abstraction & indexing
2. Auth layer & password hashing
3. Storage validation & URL formatting
4. Rate limiting & health endpoints
"""
import asyncio
import os
import sys

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

# Ensure backend directory is in path
sys.path.insert(0, os.path.dirname(__file__))

import database
import storage
import auth

async def main():
    print("--- 1. Testing Database Abstraction & Health ---")
    await database.init_db(password_hasher=auth.hash_password)
    db_health = await database.get_db_health()
    print("DB Health:", db_health)
    assert db_health["status"] == "connected"
    assert db_health["incidents_count"] > 0
    assert db_health["users_count"] > 0
    print("[PASS] Database abstraction and seeding passed!")

    print("\n--- 2. Testing Auth Layer ---")
    admin_user = await auth.get_user_by_username("admin")
    assert admin_user is not None
    assert auth.verify_password("admin123", admin_user["password"])
    token = auth.create_access_token({"user_id": admin_user["id"], "username": "admin", "role": "admin"})
    decoded = auth.decode_token(token)
    assert decoded["username"] == "admin"
    print("[PASS] User authentication, hashing, and JWT tokens passed!")

    print("\n--- 3. Testing Storage Manager ---")
    sample_jpeg = b'\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x01\x00`\x00`\x00\x00' + (b'0' * 50)
    is_valid, err = storage.validate_image_file("photo.jpg", sample_jpeg)
    assert is_valid, f"Validation error: {err}"
    
    # Test invalid extension
    is_valid_bad, err_bad = storage.validate_image_file("virus.exe", b'MZ\x90\x00' + b'0'*50)
    assert not is_valid_bad
    print(f"Bad file rejected correctly: {err_bad}")

    storage_res = await storage.save_image(sample_jpeg, "test_pothole.jpg")
    print("Saved image result:", storage_res)
    assert "image_path" in storage_res
    formatted = storage.format_image_url(storage_res["image_path"])
    print("Formatted URL:", formatted)
    storage_health = storage.get_storage_health()
    print("Storage Health:", storage_health)
    print("[PASS] Storage manager & validation passed!")

    print("\n--- 4. Testing FastAPI Endpoints via TestClient ---")
    from fastapi.testclient import TestClient
    from main import app

    client = TestClient(app)
    health_resp = client.get("/api/health")
    assert health_resp.status_code == 200
    health_json = health_resp.json()
    print("GET /api/health:", health_json)
    assert health_json["status"] == "healthy"
    assert "ai_engine" in health_json
    assert "uptime_seconds" in health_json

    # Test analytics
    analytics_resp = client.get("/api/analytics")
    assert analytics_resp.status_code == 200
    analytics_data = analytics_resp.json()
    print(f"GET /api/analytics: Total incidents: {analytics_data['total']}, Resolved: {analytics_data['resolved']}")

    # Test Login
    login_resp = client.post("/api/auth/login", json={"username": "admin", "password": "admin123"})
    assert login_resp.status_code == 200
    login_data = login_resp.json()
    assert "access_token" in login_data
    print("[PASS] Auth login endpoint returned valid Bearer token.")

    # Test Rate Limiter
    print("\n--- 5. Testing Rate Limiter (brute force protection) ---")
    hit_429 = False
    for i in range(15):
        r = client.post("/api/auth/login", json={"username": "admin", "password": "wrongpassword"})
        if r.status_code == 429:
            hit_429 = True
            print(f"Rate limit triggered successfully on attempt {i+1}: {r.json()}")
            break
    assert hit_429, "Expected 429 status code for rate limit"
    print("[PASS] Rate limit protection verified!")

    print("\n==============================================")
    print("ALL PHASE 4 BACKEND HARDENING TESTS PASSED!")
    print("==============================================")

if __name__ == "__main__":
    asyncio.run(main())
