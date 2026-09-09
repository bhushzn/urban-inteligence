import sys
import os
import time
import random
import argparse

# Fix Windows console UTF-8 output encoding for emojis
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

import cv2
import requests
import numpy as np

# Configuration
BACKEND_HOST = "127.0.0.1:8000"
BACKEND_URL = f"http://{BACKEND_HOST}/api/incidents"
HEALTH_URL = f"http://{BACKEND_HOST}/api/health"
CAMERA_ID = 0
BUS_NUMBER = random.randint(101, 999)

# Authentic Vidisha Municipal Transit Waypoints
VIDISHA_STOPS = [
    {"name": "Madhav Ganj Hub", "lat": 23.5240, "lng": 77.8115, "ward": "Ward 4"},
    {"name": "Station Road Lane", "lat": 23.5226, "lng": 77.8148, "ward": "Ward 12"},
    {"name": "Neemtal Commercial Area", "lat": 23.5190, "lng": 77.8064, "ward": "Ward 7"},
    {"name": "Durga Nagar Arterial", "lat": 23.5170, "lng": 77.8171, "ward": "Ward 9"},
    {"name": "Sanchi Highway Link", "lat": 23.5050, "lng": 77.7750, "ward": "Ward 2"},
    {"name": "Ahmedpur Link Road", "lat": 23.5350, "lng": 77.8100, "ward": "Ward 14"}
]

parser = argparse.ArgumentParser(description="CityEye Autonomous Transit Dashcam Simulator — Vidisha Municipal Network")
parser.add_argument("--camera", type=int, default=CAMERA_ID, help="Camera index (default: 0)")
parser.add_argument("--interval", type=int, default=10, help="Upload interval in seconds (default: 10)")
parser.add_argument("--test", action="store_true", help="Send a single test frame and exit")
parser.add_argument("--synthetic", action="store_true", help="Allow synthetic road simulation if no webcam is connected")
parser.add_argument("--lat", type=float, default=None, help="Custom latitude")
parser.add_argument("--lng", type=float, default=None, help="Custom longitude")
args, _ = parser.parse_known_args()

if args.lat is not None and args.lng is not None:
    ACTIVE_STOPS = [
        {"name": "Custom GPS Waypoint", "lat": args.lat, "lng": args.lng, "ward": "Custom Ward"}
    ]
    corridor_name = f"Custom GPS ({args.lat:.4f}° N, {args.lng:.4f}° E)"
else:
    ACTIVE_STOPS = VIDISHA_STOPS
    corridor_name = "Vidisha Municipal Transit Network"

print("=" * 60)
print(f"🚌 CityEye Transit Dashcam Unit — Bus #{BUS_NUMBER}")
print(f"📍 GPS Corridor: {corridor_name} (Vidisha, MP)")
print(f"📡 Backend Target: {BACKEND_URL}")
print("=" * 60)

# Pre-flight backend health check
print("🔍 Checking connection to CityEye Command Center backend...")
server_online = False
for attempt in range(1, 4):
    try:
        r = requests.get(HEALTH_URL, timeout=2.5)
        if r.status_code == 200:
            print(" Connected to CityEye Backend (HTTP 200 OK)")
            server_online = True
            break
    except Exception:
        print(f"⏳ Waiting for backend at {HEALTH_URL} (Attempt {attempt}/3)...")
        time.sleep(1)

if not server_online:
    print("⚠️ Warning: CityEye backend is not reachable at http://127.0.0.1:8000.")
    print("👉 Please ensure START.bat is running in another terminal window.")
    print("   Proceeding in live preview mode...")

# Open camera
cap = cv2.VideoCapture(args.camera)
use_synthetic = False

if not cap.isOpened():
    if args.synthetic:
        print("ℹ️ Using Synthetic Transit Camera Stream (--synthetic enabled).")
        use_synthetic = True
    else:
        print("❌ Camera Error: Physical webcam is inactive or not detected.")
        print("👉 Please turn ON your webcam or allow camera access.")
        print("👉 To run simulated road patrol without a camera, pass: --synthetic")
        sys.exit(1)
else:
    ret, test_frame = cap.read()
    if not ret:
        if args.synthetic:
            print("ℹ️ Camera frame grab failed. Using Synthetic Transit Camera Stream (--synthetic).")
            use_synthetic = True
        else:
            print("❌ Camera Error: Webcam is active but failed to grab frame (in use by another application).")
            print("👉 Please close other camera applications or pass --synthetic.")
            sys.exit(1)

def generate_synthetic_frame(waypoint: dict, bus_num: int, timestamp: str):
    """Generate realistic road patrol frame if --synthetic is enabled"""
    img = np.zeros((480, 640, 3), dtype=np.uint8)
    # Road gradient
    img[:240, :] = [45, 30, 20]     # Sky
    img[240:, :] = [30, 30, 30]     # Asphalt road
    # Road lane markings
    cv2.line(img, (320, 240), (200, 480), (200, 200, 200), 4)
    cv2.line(img, (320, 240), (440, 480), (200, 200, 200), 4)
    cv2.line(img, (320, 240), (320, 480), (0, 200, 240), 2)
    # HUD text
    cv2.putText(img, f"CITYEYE BUS #{bus_num} PATROL STREAM", (20, 35), cv2.FONT_HERSHEY_SIMPLEX, 0.65, (0, 240, 255), 2)
    cv2.putText(img, f"GPS: {waypoint['lat']:.4f} N, {waypoint['lng']:.4f} E", (20, 65), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (255, 255, 255), 1)
    cv2.putText(img, f"LOC: {waypoint['name']} ({waypoint['ward']})", (20, 90), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (180, 220, 255), 1)
    cv2.putText(img, f"TIME: {timestamp}", (20, 115), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 180), 1)
    return img

stop_idx = 0
last_upload_time = time.time()
temp_filename = "temp_dashcam_frame.jpg"

print("\n🚀 Live Transit Patrol started.")
print(" Controls:")
print("   • Press 'q' to stop.")
print("   • Press 'SPACE' to capture & upload immediately.")
print(f"   • Auto-upload every {args.interval}s.\n")

while True:
    current_time = time.time()
    cur_stop = ACTIVE_STOPS[stop_idx % len(ACTIVE_STOPS)]
    time_str = time.strftime("%Y-%m-%d %H:%M:%S")

    # Get frame
    if use_synthetic:
        frame = generate_synthetic_frame(cur_stop, BUS_NUMBER, time_str)
        time.sleep(0.04) # ~25 fps
    else:
        ret, frame = cap.read()
        if not ret or frame is None or frame.size == 0:
            print("⚠️ Camera frame unavailable (camera inactive). Waiting for camera...")
            time.sleep(1)
            continue

    # Draw telemetry HUD overlay on frame
    display_frame = frame.copy()
    cv2.rectangle(display_frame, (10, 10), (380, 85), (10, 15, 25), -1)
    cv2.rectangle(display_frame, (10, 10), (380, 85), (0, 220, 240), 1)
    cv2.putText(display_frame, f"CITYEYE BUS #{BUS_NUMBER} • BRTS LIVE", (20, 32), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (0, 240, 255), 2)
    cv2.putText(display_frame, f"GPS: {cur_stop['lat']:.4f}, {cur_stop['lng']:.4f} | {cur_stop['name'][:18]}", (20, 54), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (240, 240, 240), 1)
    next_sec = max(0, int(args.interval - (current_time - last_upload_time)))
    cv2.putText(display_frame, f"NEXT SCAN: {next_sec}s | SPACE to Force Capture", (20, 74), cv2.FONT_HERSHEY_SIMPLEX, 0.42, (0, 255, 180), 1)

    try:
        cv2.imshow(f"CityEye Transit Dashcam - Bus #{BUS_NUMBER}", display_frame)
    except Exception:
        pass

    # Check keypress
    key = cv2.waitKey(30) & 0xFF
    force_upload = (key == 32) # Space key
    if key == ord('q'):
        break

    # Upload check
    if force_upload or (current_time - last_upload_time >= args.interval) or args.test:
        print(f"\n📸 [{time_str}] Capturing frame from Bus #{BUS_NUMBER}...")
        
        # Add slight jitter for realistic movement along the corridor
        lat = cur_stop["lat"] + random.uniform(-0.0008, 0.0008)
        lng = cur_stop["lng"] + random.uniform(-0.0008, 0.0008)
        location_desc = f"{cur_stop['name']} (Bus #{BUS_NUMBER})"
        
        cv2.imwrite(temp_filename, frame)
        print(f"📡 Uploading to Command Center at {lat:.4f}, {lng:.4f} ({cur_stop['name']})...")

        try:
            with open(temp_filename, "rb") as img_file:
                payload = {
                    "type": "Auto-Dashcam Report",
                    "severity": "Medium",
                    "lat": str(round(lat, 4)),
                    "lng": str(round(lng, 4)),
                    "ward": cur_stop["ward"],
                    "location": location_desc,
                    "category": "road"
                }
                files = {"image": (temp_filename, img_file, "image/jpeg")}
                response = requests.post(BACKEND_URL, data=payload, files=files, timeout=6.0)

                if response.status_code == 200:
                    data = response.json()
                    conf = data.get("confidence", 0)
                    ai_type = data.get("type", "Anomaly Detected")
                    print(f"✅ Success! Command Center AI analyzed: {ai_type} ({conf * 100:.1f}% confidence)")
                    print(f"   Incident ID: #{data.get('id', 'N/A')} mapped at [{lat:.4f}, {lng:.4f}]")
                else:
                    print(f"⚠️ Server returned HTTP {response.status_code}: {response.text[:120]}")
        except requests.exceptions.ConnectionError:
            print(f"❌ Connection error: Could not reach backend at {BACKEND_URL}")
            print("   Please make sure the backend is running via .\\START.bat")
        except Exception as e:
            print(f"❌ Error uploading frame: {e}")

        stop_idx += 1
        last_upload_time = current_time

        if args.test:
            print("✨ Test frame uploaded successfully. Exiting.")
            break

if not use_synthetic and cap:
    cap.release()
try:
    cv2.destroyAllWindows()
except Exception:
    pass

if os.path.exists(temp_filename):
    try:
        os.remove(temp_filename)
    except Exception:
        pass

print("\n🛑 Dashcam simulator stopped cleanly.")
