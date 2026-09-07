"""
UrbanIntel AI — Phase 8 Automated Integration Tests
Direct async test without requiring external HTTP client packages
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
import main
from main import (
    get_corridor_analytics,
    get_audit_summary,
    verify_work_order_repair,
    DispatchRequest,
    dispatch_incident
)

async def run_tests():
    print("==================================================")
    print("   URBANINTEL AI — PHASE 8 AUTOMATED SUITE       ")
    print("==================================================")
    
    # 1. Initialize DB
    print("\n[Step 1] Initializing database...")
    await database.init_db(password_hasher=auth.hash_password)
    print(" -> Database initialized successfully.")

    # 2. Corridor PDI Analytics
    print("\n[Step 2] Testing Corridor PDI Analytics & Degradation Forecast...")
    corridor_data = await get_corridor_analytics()
    assert corridor_data["monitored_corridors_count"] == 5, f"Expected 5 corridors, got {corridor_data['monitored_corridors_count']}"
    assert "city_average_pdi" in corridor_data
    assert "total_budget_label" in corridor_data
    assert len(corridor_data["corridors"]) == 5

    for c in corridor_data["corridors"]:
        assert 0 <= c["pdi_score"] <= 100
        assert c["status"] in ["Optimal", "Moderate", "Critical"]
        assert c["forecast_15d"] >= 0
        assert c["forecast_30d"] >= c["forecast_15d"]
        print(f"  ✓ Corridor: {c['name']} | PDI: {c['pdi_score']} ({c['status']}) | 15d: +{c['forecast_15d']} | Cost: {c['repair_cost_label']}")
    print(f" -> City Average PDI: {corridor_data['city_average_pdi']} / 100 [PASS]")

    # 3. Executive Audit Summary Report
    print("\n[Step 3] Testing Executive Audit Summary Report...")
    audit = await get_audit_summary()
    assert audit["report_id"] == "BMC-AUDIT-2026-Q3"
    assert audit["total_lane_km_monitored"] == 382.5
    assert len(audit["contractor_leaderboard"]) >= 4
    for ct in audit["contractor_leaderboard"]:
        assert "compliance_pct" in ct
        assert "avg_quality_score" in ct
        print(f"  ✓ Contractor: {ct['name']} | Compliance: {ct['compliance_pct']}% | Rating: {ct['rating']}")
    print(f" -> Audit Summary generated: {audit['report_id']} for {audit['municipality']} [PASS]")

    # 4. Contractor Dispatch and Proof of Work Verification
    print("\n[Step 4] Testing Work Order Dispatch & Repair Verification (Proof of Work)...")
    inc_row = await database.fetch_one("SELECT id FROM incidents WHERE resolved=0 LIMIT 1")
    if not inc_row:
        inc_row = await database.fetch_one("SELECT id FROM incidents LIMIT 1")
    inc_id = inc_row[0]

    dispatch_req = DispatchRequest(
        contractor_name="PWD Zone 1 Rapid Team",
        zone="Zone 4 BRTS",
        priority="High",
        sla_hours=24,
        notes="High-priority pothole on arterial corridor"
    )
    disp_res = await dispatch_incident(inc_id, dispatch_req, current_user={"username": "admin", "role": "admin"})
    assert disp_res["success"] is True
    wo = disp_res["work_order"]
    wo_id = wo["id"]
    print(f"  ✓ Dispatched Work Order #{wo_id} to {wo['contractor_name']} (SLA: {wo['deadline']})")

    # Verify repair
    verify_res = await verify_work_order_repair(
        order_id=wo_id,
        notes="Repaired with hot-mix asphalt and roller compacted",
        inspector_name="Senior Municipal Engineer",
        repair_score=96.8
    )
    assert verify_res["success"] is True
    assert verify_res["status"] == "Completed"
    assert verify_res["repair_quality_score"] == 96.8
    assert verify_res["work_order"]["status"] == "Completed"
    assert verify_res["incident"]["resolved"] is True
    print(f"  ✓ Repair Verified! Score: {verify_res['repair_quality_score']}% | Work Order Status: {verify_res['status']} | Incident Resolved: {verify_res['incident']['resolved']} [PASS]")

    print("\n==================================================")
    print("   ALL PHASE 8 TESTS PASSED WITH 100% SUCCESS!   ")
    print("==================================================")

if __name__ == "__main__":
    asyncio.run(run_tests())
