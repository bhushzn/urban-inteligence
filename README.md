# 🏙️ UrbanIntel AI — Smart City Command Center

> **Autonomous Road Hazard & Municipal Anomaly Detection Platform**  
> *Built for Smart India Hackathon (SIH) • Problem Statement 26124*

[![CI/CD Pipeline](https://github.com/bhushzn/urban-inteligence/actions/workflows/ci.yml/badge.svg)](https://github.com/bhushzn/urban-inteligence/actions)
[![PWA](https://img.shields.io/badge/PWA-Offline--First-blueviolet.svg?logo=pwa&logoColor=white)](public/manifest.json)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![YOLOv8](https://img.shields.io/badge/YOLOv8-Ultralytics-00ffff.svg?logo=pytorch&logoColor=white)](https://ultralytics.com)
[![React 19](https://img.shields.io/badge/React-19.x-61dafb.svg?logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-4169e1.svg?logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ed.svg?logo=docker&logoColor=white)](https://www.docker.com)
[![Tests](https://img.shields.io/badge/Tests-100%25%20Passed-brightgreen.svg)](backend/verify_all.py)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## 📌 Executive Summary

Over **4,700 fatalities** and tens of thousands of serious road injuries in India each year are caused directly by potholes, unattended road fissures, and unmonitored civic hazards. Traditional municipal inspection requires slow, expensive manual inspection patrols that struggle to cover even 15% of city streets monthly.

**UrbanIntel AI** solves this crisis by transforming existing **public transport fleets (city buses, waste collection trucks, and municipal patrol vans)** into real-time scanning rovers. Equipped with on-vehicle dashcams, lightweight edge/cloud **YOLOv8 computer vision models**, and high-precision GPS, incidents are detected, classified, geocoded, and live-dispatched to an interactive Command Center in **under 50 milliseconds**.

---

## 🌟 Comprehensive Platform Capabilities (Phases 1–10)

| Category | Capabilities & Innovations |
|---|---|
| 🧠 **Edge AI & Vision** | YOLOv8 multi-class anomaly detector (potholes, garbage, waterlogging, streetlights, road fissures); live confidence scoring; binary magic-byte image validation. |
| 🗺️ **GIS Command Center** | High-definition Leaflet GIS with Bhopal Ward boundaries, cluster overlays, risk heatmaps, street view cross-links, and dual-layer routing. |
| 🚌 **Fleet Edge Stream** | Live Transit Fleet Dashcam simulator (`LiveDashcamModal.tsx`) with real-time canvas bounding box HUD, dynamic telemetry stream, and 1-click snapshot incident triage. |
| 🚑 **Safe-Route Hazard Router** | Emergency bypass engine (`SafeRouteModal.tsx`, `POST /api/routing/safe-route`) computing Fastest vs Safest paths around active road hazards with live GIS polyline projection. |
| 📊 **Pavement Health (PDI)** | Corridor Pavement Distress Index (0–100) across 5 transit arteries with interactive Monsoon Stress Simulator (0–100mm rain) and 15d/30d deterioration forecasting. |
| 👷 **Contractor Lifecycle** | Automated SLA dispatch, Proof-of-Work Before/After verification with interactive split-slider & AI smoothness score, and WhatsApp dispatch gateway with GPS navigation deep-links. |
| 🏛️ **Civic Audit & Governance** | Executive BMC Municipal Audit Report modal with print PDF stylesheet and CSV export. Citizen reporting portal with Civic Karma & Leaderboard gamification. |
| ⚡ **Performance & Resilience** | Offline-first Progressive Web App (PWA) with Service Worker caching; dual-engine DB (PostgreSQL / SQLite fallback); SlowAPI rate limiting; sub-50ms WebSockets. |
| 🛠️ **DevOps & Testing** | GitHub Actions CI/CD pipeline (`.github/workflows/ci.yml`), 1-click test runner (`VERIFY.bat`), and unified regression orchestrator (`backend/verify_all.py`). |

---

## 🏗️ System Architecture

Detailed architecture specifications, component diagrams, and sequence flows are documented in **[ARCHITECTURE.md](ARCHITECTURE.md)**.

```
                              EDGE SENSING LAYER
                   ┌──────────────────────────────────────┐
                   │  🚌 City Bus / Municipal Dashcam     │
                   │  (dashcam_simulator.py / Live Stream)│
                   └──────────────────┬───────────────────┘
                                      │ HTTP POST (GPS + Frames)
                                      ▼
                             BACKEND API LAYER (FastAPI)
                   ┌──────────────────────────────────────┐
                   │  ├── 🧠 YOLOv8 Anomaly Classifier    │
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
  │  (Auto-Indexing & Pools)  │       │ ├── Leaflet GIS & Heatmaps    │
  └───────────────────────────┘       │ ├── Fleet Dashcam HUD         │
                                      │ ├── Proof-of-Work Verification│
                                      │ ├── Corridor PDI Simulator    │
                                      │ └── Service Worker Shell Cache│
                                      └───────────────────────────────┘
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

### Option 3: Full-Stack Docker Compose

Run the complete production container stack (FastAPI, React via Nginx, and PostgreSQL):
```bash
docker compose up --build
```
- **Dashboard:** [http://localhost:5173](http://localhost:5173)
- **API Health:** [http://localhost:8000/api/health](http://localhost:8000/api/health)

---

### Option 4: Manual Step-by-Step Setup

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

## 🚌 Running the Edge AI Dashcam Simulator

To simulate a roving city bus capturing road frames and uploading them live:
```bash
python dashcam_simulator.py
```
*Tip: Or open the **"Fleet Dashcam"** button inside the Command Center navbar for the interactive in-browser simulator with real-time HUD!*

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
| `POST` | `/api/auth/login` | Authenticate and obtain JWT Bearer token | None (Rate Limited) |
| `POST` | `/api/auth/register` | Register new municipal field agent | None (Rate Limited) |
| `GET` | `/api/auth/me` | Fetch currently authenticated user session | Bearer Token |
| `GET` | `/api/incidents` | List incidents with ward/severity/status filtering | None |
| `POST` | `/api/incidents` | Ingest new incident with GPS and photo evidence | None (Rate Limited) |
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

## 🌐 Cloud Deployment (Vercel + Render + Supabase)

See the full, illustrated guide in **[DEPLOYMENT.md](DEPLOYMENT.md)**.

1. **Database:** Create a free project on [Supabase](https://supabase.com) and copy the PostgreSQL URI into `DATABASE_URL`.
2. **Backend:** Deploy on [Render.com](https://render.com) using the included `render.yaml` or `Dockerfile`.
3. **Frontend:** Deploy on [Vercel](https://vercel.com) by importing the repository and setting `VITE_API_URL`.

---

## 👥 Hackathon Team & Acknowledgements

- **Team Name:** UrbanIntel Innovators
- **Problem Statement:** SIH Problem Statement 26124 (Smart Cities & Urban Governance)
- **Primary Focus:** Civic Infrastructure Safety, Automated Computer Vision, Real-Time Incident Orchestration
