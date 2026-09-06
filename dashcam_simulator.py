import cv2
import requests
import time
import random

# Configuration
BACKEND_URL = "http://localhost:8000/api/incidents"
CAMERA_ID = 0  # 0 is usually the built-in laptop webcam
BUS_NUMBER = random.randint(101, 999)
WARD = "Ward 7"
LOCATION = f"Moving Bus #{BUS_NUMBER} Dashcam"

print("==================================================")
print(f"🚌 Starting Dashcam Simulator for Bus #{BUS_NUMBER}")
print("==================================================")
print("Press 'q' in the camera window to stop.")

# Start webcam
cap = cv2.VideoCapture(CAMERA_ID)

if not cap.isOpened():
    print("❌ Error: Could not open webcam.")
    exit()

last_upload_time = time.time()

while True:
    ret, frame = cap.read()
    if not ret:
        break

    # Show the live feed on screen
    cv2.imshow(f"Dashcam Feed - Bus #{BUS_NUMBER}", frame)

    # Every 10 seconds, capture a frame and send it to the Command Center
    current_time = time.time()
    if current_time - last_upload_time > 10:
        print("\n📸 Capturing frame from dashcam...")
        
        # Save frame temporarily
        temp_filename = "temp_dashcam_frame.jpg"
        cv2.imwrite(temp_filename, frame)
        
        # Simulate moving GPS coordinates (randomly walking around Bhopal)
        lat = 23.2599 + random.uniform(-0.01, 0.01)
        lng = 77.4126 + random.uniform(-0.01, 0.01)

        print(f"📡 Uploading to Command Center at {lat:.4f}, {lng:.4f}...")
        
        try:
            with open(temp_filename, "rb") as img_file:
                # Prepare the payload identical to the field agent app
                payload = {
                    "type": "Auto-Dashcam Report",
                    "severity": "Medium",
                    "lat": str(lat),
                    "lng": str(lng),
                    "ward": WARD,
                    "location": LOCATION,
                    "category": "road"
                }
                files = {"image": (temp_filename, img_file, "image/jpeg")}
                
                # Send to our FastAPI backend
                response = requests.post(BACKEND_URL, data=payload, files=files)
                
                if response.status_code == 200:
                    data = response.json()
                    # The backend YOLO model analyzes it. If confidence > 0.1, it overrides the type.
                    print(f"✅ Success! Command Center AI analyzed it as: {data.get('type')} ({data.get('confidence', 0)*100:.0f}%)")
                else:
                    print(f"⚠️ Failed to upload. Server returned: {response.status_code}")
        
        except Exception as e:
            print(f"❌ Connection error: {e}")
            
        last_upload_time = current_time

    # Exit if 'q' is pressed
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
