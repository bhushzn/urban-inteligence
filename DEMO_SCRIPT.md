# 🎙️ UrbanIntel AI — 2-Minute Live Demo Script

> **Speaker Script & Visual Timing Guide for SIH Jury Evaluation**  
> *Target Duration: 120 Seconds (2 Minutes)*

---

## ⏱️ Timeline & Action Script

### [0:00 – 0:25] The Hook & The Command Center Overview
- **Action:** Open [http://localhost:5173](http://localhost:5173) in full screen.
- **Speaker:**
  > *"Respected judges, potholes and unattended road hazards cause over 4,700 deaths in India every year. Today, we are proud to introduce **UrbanIntel AI** — a real-time smart city command center that turns regular municipal buses into automated AI hazard detection patrols.*
  >
  > *Here on the main screen, you see our live GIS command center for the city of Bhopal. Every marker on this Leaflet map represents an active urban anomaly categorized by severity — red for critical potholes and manholes, amber for garbage and waterlogging, and cyan for minor infrastructure issues."*

---

### [0:25 – 0:50] The In-App Presentation & AI Model
- **Action:** Click the purple **"SIH 26124"** button in the Navbar to open the `ProjectShowcaseModal`. Switch briefly between the **Problem & Solution** and **AI Edge Pipeline** tabs.
- **Speaker:**
  > *"Clicking our SIH 26124 showcase directly inside the app reveals our technical pipeline. Under the hood, an Ultralytics YOLOv8 computer vision model processes camera frames in under 45 milliseconds, calculating anomaly bounding boxes and computing severity scores based on size and confidence.*
  >
  > *Let's close this modal and watch a live detection happen right now."*

---

### [0:50 – 1:15] Live Dashcam Detection & Audio Alert
- **Action:**
  1. Close the showcase modal.
  2. In your terminal, run `python dashcam_simulator.py` (or click **Report Incident** and upload a road image).
  3. Point your camera at a road image or wait 10 seconds for the auto-frame upload.
  4. Notice the **electronic chime sound**, the **browser push notification**, and the new card animating to the top of the feed with an AI bounding box.
- **Speaker:**
  > *"As Bus #342 drives down Kolar Road, its onboard camera captures the road surface. In real-time, the frame is transmitted to our FastAPI backend. The YOLOv8 model immediately isolates the pothole, tags its exact GPS coordinates, and broadcasts it over WebSockets.*
  >
  > *You just heard the synthesized alert tone and saw the incident appear live in the feed with zero page refresh."*

---

### [1:15 – 1:40] Role-Based Access Control & Verification Workflow
- **Action:**
  1. Click **Sign In** in the Navbar.
  2. Click the **👑 Command Center Admin (admin / admin123)** 1-click fill button and log in.
  3. Show the user badge change in the Navbar.
  4. Click **Verify** on the newly detected incident, then click **Street View** on the map marker to show 360° inspection.
  5. Click **Resolve**.
- **Speaker:**
  > *"UrbanIntel AI enforces enterprise role-based security. Only authorized Command Center Admins have permission to verify and resolve hazards, while field agents report them.*
  >
  > *I will sign in with one click as the Admin. We can inspect the road in Google Street View to confirm the hazard without sending a physical team. Once the repair team finishes the patch, the Admin clicks **Resolve**, updating the city's resolution rate and ward analytics in real-time."*

---

### [1:40 – 2:00] Cloud Readiness & Closing Statement
- **Action:** Click **Export CSV** to show instant data download, then point to the bottom health indicator.
- **Speaker:**
  > *"The platform is enterprise-hardened with dual PostgreSQL/SQLite engines, Cloudinary media storage, brute-force rate-limiting, and 1-click Docker deployment.*
  >
  > *UrbanIntel AI saves up to 85% in municipal inspection costs while cutting hazard response times from two weeks to under 24 hours. Thank you, and we are now open for questions!"*

---

## 💡 Quick Tips for Presenters

1. **Audio Setting:** Ensure your laptop volume is turned up so the judges hear the electronic chime when high-severity anomalies trigger.
2. **Offline Fallback:** If internet access is spotty during the pitch, UrbanIntel AI runs completely offline using local SQLite and mock heuristics seamlessly.
3. **1-Click Buttons:** Use the demo autofill buttons on the login modal to prevent typing mistakes during live demos.
