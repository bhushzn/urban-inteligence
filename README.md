# 🏙️ UrbanIntel AI — Smart City Command Center

> **Autonomous Road Hazard & Municipal Anomaly Detection Platform**  
> *Built for Smart India Hackathon (SIH) • Problem Statement 26124*

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![YOLOv8](https://img.shields.io/badge/YOLOv8-Ultralytics-00ffff.svg?logo=pytorch&logoColor=white)](https://ultralytics.com)
[![React 19](https://img.shields.io/badge/React-19.x-61dafb.svg?logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-4169e1.svg?logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ed.svg?logo=docker&logoColor=white)](https://www.docker.com)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## 📌 Executive Summary

Over **4,700 fatalities** and tens of thousands of serious road injuries in India each year are caused directly by potholes, unattended road fissures, and unmonitored civic hazards. Traditional municipal inspection requires slow, expensive manual inspection patrols that struggle to cover even 15% of city streets monthly.

**UrbanIntel AI** solves this crisis by transforming existing **public transport fleets (city buses, waste collection trucks, and municipal patrol vans)** into real-time scanning rovers. Equipped with on-vehicle dashcams, lightweight edge/cloud **YOLOv8 computer vision models**, and high-precision GPS, incidents are detected, classified, geocoded, and live-dispatched to an interactive Command Center in **under 50 milliseconds**.

---

## 🌟 Core Features

- 🧠 **Real-Time Edge AI Detection (YOLOv8):** Instant detection and bounding-box segmentation of potholes, unauthorized garbage dumping, waterlogging, damaged streetlights, and road encroachments.
- 🗺️ **High-Definition GIS Interactive Map (Bhopal Wards):** Color-coded anomaly markers, cluster overlays, ward density heatmaps, and Google Street View validation.
- ⚡ **Sub-Second Live WebSocket Dispatch:** Live incident stream pushed to municipal operators with urgent synthesized multi-tone audio alerts and browser push notifications.
- 🔐 **Role-Based Access Control (RBAC):** JWT Bearer authentication separating administrative validation roles (`admin`) from frontline field surveyors (`field_agent`).
- 🗄️ **Dual-Engine Scalable Database:** Built-in auto-indexing with instant zero-setup offline SQLite fallback and seamless cloud PostgreSQL (`asyncpg`) support for Supabase/Neon.
- ☁️ **Enterprise Media Storage:** Automated Cloudinary CDN sync for high-resolution image evidence with fallback local persistence.
- 🛡️ **Defensive API Hardening:** SlowAPI rate-limiting against brute force, strict binary magic-byte image validation, and structured telemetry via `GET /api/health`.
- 🚌 **Bus Dashcam Simulator:** Hardware/webcam simulation script streaming live driving telemetry into the command center.

---

## 🏗️ System Architecture

```
                                  EDGE SENSING LAYER
                       ┌──────────────────────────────────────┐
                       │  🚌 City Bus / Municipal Dashcam     │
                       │  (dashcam_simulator.py / OpenCV)     │
                       └──────────────────┬───────────────────┘
                                          │ HTTP POST (GPS + Frames)
                                          ▼
                                 BACKEND API LAYER
                       ┌──────────────────────────────────────┐
                       │       ⚡ FastAPI High-Speed Core     │
                       │  ├── 🧠 YOLOv8 Anomaly Classifier    │
                       │  ├── 🛡️ SlowAPI Rate Limiting        │
                       │  ├── 🔐 JWT Bearer RBAC (Admin/Agent)│
                       │  └── ☁️ Cloudinary / Local Storage   │
                       └──────────┬─────────────────┬─────────┘
                                  │                 │
                SQL Read / Write  │                 │ WebSocket Broadcast
                                  ▼                 ▼
             DATABASE LAYER              COMMAND CENTER DASHBOARD
      ┌───────────────────────────┐    ┌───────────────────────────┐
      │  🗄️ PostgreSQL / SQLite   │    │ 🌐 React 19 + Leaflet GIS │
      │  (Auto-Indexing & Pools)  │    │ ├── Live Incident Feed    │
      └───────────────────────────┘    │ ├── Audio Synthesizer     │
                                       │ ├── Ward Hotspot Analytics│
                                       │ └── Verification Workflow │
                                       └───────────────────────────┘
```

---

## 🚀 Quickstart Guide

### Option 1: 1-Click Launch on Windows (Recommended)

Simply double-click [`START.bat`](START.bat) in the project root:
```cmd
START.bat
```
This automatically launches:
1. **FastAPI Backend:** [http://localhost:8000](http://localhost:8000) (with automatic live reloading)
2. **React Frontend:** [http://localhost:5173](http://localhost:5173) (automatically opens in browser)
3. **Interactive Swagger Docs:** [http://localhost:8000/docs](http://localhost:8000/docs)

---

### Option 2: 1-Command Full-Stack Docker Compose

Run the complete isolated production stack (FastAPI, React via Nginx, and PostgreSQL):
```bash
docker compose up --build
```
- **Dashboard:** [http://localhost:5173](http://localhost:5173)
- **API Health:** [http://localhost:8000/api/health](http://localhost:8000/api/health)

---

### Option 3: Manual Step-by-Step Setup

#### 1. Backend Setup
```bash
cd backend
python -m venv venv
# Windows:
venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

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

## 🚌 Running the Bus Dashcam Simulator

To simulate a roving city bus capturing road frames and uploading them live:
```bash
python dashcam_simulator.py
```
*Tip: You can change `CAMERA_ID = 0` to a video file path or another webcam.*

---

## 🔑 Default Credentials (Demo Accounts)

The system automatically initializes demo accounts on first boot:

| Role | Username | Password | Permissions |
|---|---|---|---|
| 👑 **Command Center Admin** | `admin` | `admin123` | Full access: Verify, Resolve, Export CSV, Filter |
| 👷 **Field Agent** | `agent` | `agent123` | Report new incidents, upload photos |

*Note: 1-click autofill buttons are built directly into the Login modal for instant evaluation.*

---

## 📡 REST API & WebSocket Reference

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/health` | System health, DB status, AI status, and active WebSockets | None |
| `POST` | `/api/auth/login` | Authenticate and obtain JWT Bearer token | None (Rate Limited) |
| `POST` | `/api/auth/register` | Register new municipal field agent | None (Rate Limited) |
| `GET` | `/api/auth/me` | Fetch currently authenticated user session | Bearer Token |
| `GET` | `/api/incidents` | List incidents with ward/severity/resolution filtering | None |
| `POST` | `/api/incidents` | Ingest new incident with GPS and image | None (Rate Limited) |
| `PATCH` | `/api/incidents/{id}/verify` | Mark incident as verified by command center | **Admin Only** |
| `PATCH` | `/api/incidents/{id}/resolve` | Mark hazard as repaired/resolved | **Admin Only** |
| `POST` | `/api/analyze` | Run real-time YOLOv8 inference preview on image | None |
| `GET` | `/api/analytics` | Total counts, resolution rate, and ward breakdowns | None |
| `WS` | `/ws` | Real-time WebSocket event feed for live incidents | None |

---

## 🌐 Cloud Deployment (Vercel + Render + Supabase)

See the full, illustrated guide in [DEPLOYMENT.md](DEPLOYMENT.md).

1. **Database:** Create a free project on [Supabase](https://supabase.com) and copy the PostgreSQL URI.
2. **Backend:** Deploy on [Render.com](https://render.com) using the included `render.yaml` or Dockerfile.
3. **Frontend:** Deploy on [Vercel](https://vercel.com) by importing the repository and setting `VITE_API_URL`.

---

## 👥 Hackathon Team & Acknowledgements

- **Team Name:** UrbanIntel Innovators
- **Problem Statement:** SIH Problem Statement 26124 (Smart Cities & Urban Governance)
- **Primary Focus:** Civic Infrastructure Safety, Automated Computer Vision, Real-Time Incident Orchestration
