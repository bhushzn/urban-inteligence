# 🏙️ CityEye — Smart City Command Center

> **Autonomous Road Hazard & Municipal Anomaly Detection Platform**  
> *Built for Smart India Hackathon (SIH) • Problem Statement 26124*  
> *Municipal Deployment Focus: **Vidisha, Madhya Pradesh** (`23.5230° N, 77.8120° E`)*

[![CI/CD Pipeline](https://github.com/bhushzn/urban-inteligence/actions/workflows/ci.yml/badge.svg)](https://github.com/bhushzn/urban-inteligence/actions)
[![PWA](https://img.shields.io/badge/PWA-Offline--First-blueviolet.svg?logo=pwa&logoColor=white)](public/manifest.json)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![YOLOv8](https://img.shields.io/badge/YOLOv8-Ultralytics-00ffff.svg?logo=pytorch&logoColor=white)](https://ultralytics.com)
[![Google Maps](https://img.shields.io/badge/Google%20Maps-Streets%20%7C%20Satellite-4285f4.svg?logo=googlemaps&logoColor=white)](https://maps.google.com)
[![React 19](https://img.shields.io/badge/React-19.x-61dafb.svg?logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-4169e1.svg?logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![Tests](https://img.shields.io/badge/Tests-100%25%20Passed-brightgreen.svg)](backend/verify_all.py)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## 📌 Executive Summary

Over **4,700 fatalities** and tens of thousands of serious road injuries in India each year are caused directly by potholes, unattended road fissures, and unmonitored civic hazards. Traditional municipal inspection requires slow, expensive manual inspection patrols that struggle to cover even 15% of city streets monthly.

**CityEye** solves this crisis by transforming existing **public transport fleets (city buses, waste collection trucks, and municipal patrol vans)** into real-time scanning rovers. Focused on **Vidisha Municipal Corporation**, on-vehicle dashcams combined with edge/cloud **YOLOv8 computer vision models** and accurate GPS allow hazards to be detected, classified, geocoded, and live-dispatched to an interactive Command Center in **under 50 milliseconds**.

---

## 🌟 Comprehensive Platform Capabilities

| Category | Capabilities & Innovations |
|---|---|
| 🗺️ **Google Maps GIS Command** | Authentic Google Maps integration (`[ 🗺️ Google Map \| 🛰️ Satellite \| 🌙 Dark ]`) with **zero API key required**. Full Vidisha transit corridors (Madhav Ganj, Neemtal, Station Rd, Durga Nagar, Sanchi Highway). |
| 📍 **Hardware EXIF & Live GPS** | Automatic extraction of exact satellite GPS coordinates from camera EXIF metadata (`Pillow`), paired with browser high-accuracy geolocation and zero-key IP geolocation fallback (`/api/geo/current`). |
| 🧠 **Edge AI & Vision** | YOLOv8 multi-class anomaly detector (potholes, garbage dumps, waterlogging, streetlights, road fissures); live confidence scoring; binary magic-byte image validation. |
| 🚌 **Fleet Dashcam & Mobile Cam** | Real-time transit camera stream with on-screen HUD (live speedometer, GPS coordinates, timestamp ticker, and instant spacebar snapshot). Strict stream guards prevent empty or black frame uploads. |
| 🚫 **Zero Dummy Data Guarantee** | 100% genuine photographic evidence for all logged incidents. No placeholder images or dark dummy records. |
| 🚑 **Safe-Route Hazard Router** | Emergency bypass engine (`SafeRouteModal.tsx`, `POST /api/routing/safe-route`) computing Fastest vs Safest paths around active road hazards with live GIS polyline projection. |
| 📊 **Pavement Health (PDI)** | Corridor Pavement Distress Index (0–100) across Vidisha municipal arteries with interactive Monsoon Stress Simulator (0–100mm rain) and 15d/30d deterioration forecasting. |
| 👷 **Contractor Lifecycle** | Automated SLA dispatch, Proof-of-Work Before/After verification with interactive split-slider & AI smoothness score, and WhatsApp dispatch gateway with GPS navigation deep-links. |
| 🏛️ **Civic Audit & Governance** | Executive Vidisha Municipal Audit Report with print PDF stylesheet and CSV export. Citizen reporting portal with Civic Karma & Leaderboard gamification. |
| ⚡ **Performance & Resilience** | Offline-first Progressive Web App (PWA) with Service Worker caching; dual-engine DB (PostgreSQL / SQLite fallback); SlowAPI rate limiting; sub-50ms WebSockets. |

---

## 🏗️ System Architecture

Detailed architecture specifications, component diagrams, and sequence flows are documented in **[ARCHITECTURE.md](ARCHITECTURE.md)**.

```
                              EDGE SENSING LAYER
                   ┌──────────────────────────────────────┐
                   │  🚌 Vidisha Transit Bus / Dashcam    │
                   │  (dashcam_simulator.py / Mobile Cam) │
                   └──────────────────┬───────────────────┘
                                      │ HTTP POST (EXIF GPS + Frames)
                                      ▼
                             BACKEND API LAYER (FastAPI)
                   ┌──────────────────────────────────────┐
                   │  ├── 🧠 YOLOv8 Anomaly Classifier    │
                   │  ├── 📍 EXIF GPS Metadata Extractor  │
                   │  ├── 🚑 Safe-Route Emergency Router  │
                   │  ├── 📊 Corridor PDI Forecaster      │
                   │  ├── 📲 WhatsApp Dispatch Gateway    │
                   │  ├── 🛡️ SlowAPI & Magic-Byte Filter  │
                   │  └── 🔐 JWT Bearer RBAC (Admin/Agent)│
                   └──────────┬─────────────────┬─────────┘
                              │                 │
            SQL Read / Write  │                 │ WebSocket Broadcast
                              ▼                 ▼
         DATABASE LAYER                     COMMAND CENTER & PWA
  ┌───────────────────────────┐       ┌───────────────────────────────┐
  │  🗄️ PostgreSQL / SQLite   │       │ 🌐 React 19 + TypeScript + PWA│
  │  (Auto-Indexing & Pools)  │       │ ├── 🗺️ Google Maps + Satellite │
  │                           │       │ ├── 🚌 Fleet Dashcam HUD      │
  │                           │       │ ├── 📸 Active Camera Snaps    │
  │                           │       │ ├── 👷 Proof-of-Work Verifier │
  │                           │       │ └── 📊 Corridor PDI Forecaster│
  └───────────────────────────┘       └───────────────────────────────┘
```

---

## 🚀 Quickstart Guide

### Option 1: 1-Click Launch on Windows (Recommended)

Double-click [`START.bat`](START.bat) in the project root:
```cmd
START.bat
```
This automatically launches:
1. **FastAPI Backend:** [http://localhost:8000](http://localhost:8000) (auto-reloading enabled)
2. **React Frontend:** [http://localhost:5173](http://localhost:5173) (opens automatically in default browser)
3. **Interactive Swagger Docs:** [http://localhost:8000/docs](http://localhost:8000/docs)

---

### Option 2: 1-Click Automated Regression Verification

Double-click [`VERIFY.bat`](VERIFY.bat) or run:
```cmd
VERIFY.bat
```
This runs the full test suite (`backend/verify_all.py` and `npm run build`), verifying all 10 phases in under 10 seconds.

---

### Option 3: Manual Step-by-Step Setup

#### 1. Backend Setup
```bash
cd backend
python -m venv .venv
# Windows:
.venv\Scripts\activate
# Linux/macOS:
source .venv/bin/activate

pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

#### 2. Frontend Setup
```bash
# In the project root:
npm install
npm run dev
```

---

## 🚌 Running the Autonomous Transit Dashcam Simulator

To simulate a roving transit bus capturing road frames and streaming live telemetry along the **Vidisha Municipal Network**:
```bash
# Run with physical webcam:
python dashcam_simulator.py

# Or run in simulated road mode (if no physical webcam is plugged in):
python dashcam_simulator.py --synthetic
```

**Controls inside Dashcam window:**
- Press **`SPACE`** to immediately capture and log a frame to the Command Center.
- Press **`q`** to exit cleanly.

*Tip: You can also click the **"Fleet Dashcam"** button inside the Command Center navbar to use your smartphone or laptop webcam directly inside the browser!*

---

## 🔑 Default Credentials (Demo Accounts)

The system automatically initializes demo accounts on first boot:

| Role | Username | Password | Permissions |
|---|---|---|---|
| 👑 **Command Center Admin** | `admin` | `admin123` | Full access: Verify, Resolve, Contractor Dispatch, PDF Export, Corridor Analytics |
| 👷 **Field Agent** | `agent` | `agent123` | Report new incidents, upload photos, mobile capture |

*Note: 1-click autofill buttons are built directly into the Login modal for instant evaluation.*

---

## 📡 REST API & WebSocket Reference

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/health` | System telemetry, DB status, AI model status, WebSocket clients | None |
| `GET` | `/api/geo/current` | Auto-detect device/client real GPS coordinates & city | None |
| `POST` | `/api/auth/login` | Authenticate and obtain JWT Bearer token | None (Rate Limited) |
| `POST` | `/api/auth/register` | Register new municipal field agent | None (Rate Limited) |
| `GET` | `/api/auth/me` | Fetch currently authenticated user session | Bearer Token |
| `GET` | `/api/incidents` | List incidents with ward/severity/status filtering | None |
| `POST` | `/api/incidents` | Ingest incident with EXIF GPS auto-extraction & photo evidence | None (Rate Limited) |
| `PATCH` | `/api/incidents/{id}/verify` | Mark incident as verified by municipal command | **Admin Only** |
| `PATCH` | `/api/incidents/{id}/resolve` | Mark hazard as repaired/resolved | **Admin Only** |
| `POST` | `/api/incidents/{id}/dispatch`| Create contractor work order with SLA deadline | **Admin Only** |
| `POST` | `/api/workorders/{id}/verify` | Verify repair proof-of-work with AI smoothness score | **Admin Only** |
| `POST` | `/api/workorders/{id}/notify` | Send contractor WhatsApp dispatch notification | **Admin Only** |
| `GET` | `/api/analytics/corridors` | Pavement Distress Index (PDI) with weather simulation | None |
| `GET` | `/api/reports/audit-summary` | Municipal audit report with budget & contractor metrics | None |
| `POST` | `/api/routing/safe-route` | Hazard-aware emergency route computation (Fastest vs Safest)| None |
| `GET` | `/api/citizen/karma` | Citizen leaderboards and civic rewards points | None |
| `POST` | `/api/analyze` | Real-time YOLOv8 inference preview on image | None |
| `WS` | `/ws` | Real-time WebSocket event feed for live incidents | None |

---

## 🎓 SIH Grand Jury Defense & Q&A

Preparing for judging or technical scrutiny? Read the comprehensive **[JUDGE_QA.md](JUDGE_QA.md)** guide covering:
- Handling GPS inaccuracy and multipath reflections in Indian urban canyons
- False positive suppression (shadows, tar bands, manholes vs potholes)
- Edge hardware cost, thermals, and vehicle battery management
- Pavement Distress Index (PDI) mathematical formulation
- Cold-start offline operations and zero-cost cloud scalability

---

## 👥 Hackathon Team & Acknowledgements

- **Team Name:** UrbanIntel Innovators
- **Problem Statement:** SIH Problem Statement 26124 (Smart Cities & Urban Governance)
- **Deployment City:** Vidisha, Madhya Pradesh
- **Primary Focus:** Civic Infrastructure Safety, Automated Computer Vision, Real-Time Incident Orchestration
