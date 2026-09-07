"""
UrbanIntel AI — Phase 9 Automated Test Suite
Direct async tests for:
1. Safe-Route Hazard-Aware Navigation Engine
2. Multichannel WhatsApp/SMS Contractor Gateway
3. Citizen Karma & Community Rewards Profile
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

sys.path.insert(0, os.path.dirname(__file__))

import database
import auth
from main import (
    calculate_safe_route,
    SafeRouteRequest,
    dispatch_contractor_notification,
    get_citizen_karma
)

async def run_tests():
    print("==================================================")
    print("   URBANINTEL AI — PHASE 9 AUTOMATED SUITE       ")
    print("==================================================")

    # 1. Init DB
    print("\n[Step 1] Initializing database...")
    await database.init_db(password_hasher=auth.hash_password)
    print(" -> Database ready.")

    # 2. Test Safe Route Navigation
    print("\n[Step 2] Testing Safe-Route Hazard-Aware Navigation...")
    req = SafeRouteRequest(
        origin="AIIMS Hospital Bhopal",
        destination="MP Nagar Commercial Hub",
        vehicle_type="ambulance"
    )
    route_res = await calculate_safe_route(req)
    assert "fastest_route" in route_res, "Missing fastest_route"
    assert "safest_route" in route_res, "Missing safest_route"
    assert "turn_guidance" in route_res, "Missing turn_guidance"

    fast = route_res["fastest_route"]
    safe = route_res["safest_route"]

    assert fast["hazards_encountered"] >= safe["hazards_encountered"]
    assert safe["smoothness_score"] > fast["smoothness_score"]
    assert safe["risk_score"] < fast["risk_score"]

    print(f"  ✓ Origin: {route_res['origin']} -> Destination: {route_res['destination']}")
    print(f"  ✓ Fastest Route: {fast['distance_km']} km, {fast['duration_minutes']} min, Hazards: {fast['hazards_encountered']}, Risk: {fast['risk_score']}%")
    print(f"  ✓ Safest Route:  {safe['distance_km']} km, {safe['duration_minutes']} min, Smoothness: {safe['smoothness_score']}%, Risk: {safe['risk_score']}%")
    print(f"  ✓ Turn Guidance Steps: {len(route_res['turn_guidance'])} steps generated [PASS]")

    # 3. Test Multichannel Contractor WhatsApp Gateway
    print("\n[Step 3] Testing Multichannel WhatsApp Contractor Dispatch Gateway...")
    wo_row = await database.fetch_one("SELECT id FROM work_orders LIMIT 1")
    wo_id = wo_row[0] if wo_row else 1
    
    notify_res = await dispatch_contractor_notification(order_id=wo_id)
    assert notify_res["success"] is True
    assert "whatsapp_url" in notify_res
    assert "gps_navigation_url" in notify_res
    assert notify_res["whatsapp_url"].startswith("https://wa.me/?text=")
    print(f"  ✓ Dispatch Order #{wo_id}: WhatsApp Link Generated ({len(notify_res['message_preview'])} chars preview) [PASS]")

    # 4. Test Citizen Karma & Community Rewards
    print("\n[Step 4] Testing Citizen Karma & Community Rewards Profile...")
    karma = await get_citizen_karma()
    assert karma["karma_points"] > 0
    assert "tier" in karma
    assert len(karma["available_perks"]) >= 3
    print(f"  ✓ Citizen: {karma['citizen_name']} | Points: {karma['karma_points']} | Tier: {karma['tier']} | Rank #{karma['leaderboard_rank']} [PASS]")

    print("\n==================================================")
    print("   ALL PHASE 9 TESTS PASSED WITH 100% SUCCESS!   ")
    print("==================================================")

if __name__ == "__main__":
    asyncio.run(run_tests())
