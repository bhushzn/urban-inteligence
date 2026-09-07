# UrbanIntel AI — End-to-End System Architecture 🏗️

> **Smart India Hackathon (SIH) • Problem Statement 26124**  
> *Autonomous Road Anomaly, Fleet Sensing & Municipal Dispatch Platform*

---

## 🏛️ High-Level System Architecture Diagram

```mermaid
flowchart TB
    subgraph "1. SENSING LAYER (EDGE & CITIZENS)"
        BusCam["🚌 Public Transit Fleet Dashcams\n(Sony Starvis 1080p @ 30fps)"]
        CitizenApp["📱 Citizen Mobile PWA\n(GPS Auto-Detection & Camera)"]
        EdgeAI["⚡ Embedded Edge Inference\n(NVIDIA Jetson Nano / YOLOv8n)"]
        BusCam --> EdgeAI
    end

    subgraph "2. INGESTION & NETWORK GATEWAY"
        FastAPI["🚀 FastAPI Core Ingestion Engine\n(SlowAPI Rate Limiter & Magic Byte Validator)"]
        WSManager["📡 WebSocket Broadcast Hub\n(Real-Time Full-Duplex Broadcast)"]
        EdgeAI -->|JSON Telemetry + Crop < 150KB| FastAPI
        CitizenApp -->|Multipart Upload| FastAPI
        FastAPI --> WSManager
    end

    subgraph "3. STORAGE & DATA ABSTRACTION LAYER"
        DualDB[("🗄️ Database Abstraction Engine\nPostgreSQL asyncpg / SQLite aiosqlite")]
        CDN["☁️ Cloudinary CDN / Local Fallback Storage\n(Zero-Loss Image Store)"]
        FastAPI --> DualDB
        FastAPI --> CDN
    end

    subgraph "4. MUNICIPAL INTELLIGENCE & AI ENGINES"
        PDIEngine["📊 PDI Corridor Analytics Engine\nPavement Distress Index (0-100)\n15d/30d Degradation Forecaster"]
        SafeRouter["🧭 Safe-Route Hazard-Aware Router\nAmbulance Bypass & Smoothness Optimization"]
        VerifyAI["🛠️ Proof-of-Work Verification AI\nBefore/After Surface Compaction Scorer"]
        KarmaEngine["🌟 Civic Karma & Rewards Engine\nCitizen Verification & Green Points"]
        DualDB --> PDIEngine
        DualDB --> SafeRouter
        DualDB --> VerifyAI
        DualDB --> KarmaEngine
    end

    subgraph "5. COMMAND CENTER & DISPATCH CHANNELS"
        Dashboard["🖥️ React 19 + Leaflet GIS Command Center\n(Dark Glassmorphism UI)"]
        WhatsApp["📲 WhatsApp / SMS Contractor Gateway\n(Pre-Formatted GPS Deep Links)"]
        ExecAudit["📋 Executive BMC Audit Report\n(PDF Print & Raw CSV Ingestion)"]
        WSManager --> Dashboard
        FastAPI --> WhatsApp
        PDIEngine --> ExecAudit
    end

    subgraph "6. FIELD EXECUTION & REPAIR"
        Contractors["👷 Municipal Contractor Crews\n(PWD, BMC, Smart City Infra, MP Urja)"]
        WhatsApp --> Contractors
        Contractors -->|Upload After-Repair Photo| VerifyAI
    end
```

---

## 🔄 End-to-End Operational Lifecycle

```mermaid
sequenceDiagram
    autonumber
    actor Bus as 🚌 Municipal Patrol Bus
    actor Citizen as 📱 Citizen / Commuter
    participant API as 🚀 UrbanIntel API
    participant DB as 🗄️ Database & Spatial Index
    participant UI as 🖥️ Command Center
    actor Admin as 👨‍💼 Command Center Admin
    actor Contractor as 👷 PWD Repair Crew

    Note over Bus,Citizen: Anomaly Detected
    alt Bus Dashcam Detection
        Bus->>API: Edge Telemetry (YOLOv8 BBox + GPS Coords)
    else Citizen Grievance
        Citizen->>API: Mobile PWA Upload (GPS + Photo)
    end

    API->>DB: Store Incident & Deduplicate (within 5m radius)
    API-->>UI: WebSocket Broadcast (Audio Chime + Push Alert)
    UI-->>Admin: Render Red Marker on Leaflet GIS & Heatmap

    Admin->>UI: Select Incident & Assign Contractor (24h SLA)
    UI->>API: POST /api/incidents/{id}/dispatch
    API->>Contractor: WhatsApp Dispatch (Google Maps GPS Link + Photo)

    Note over Contractor: Physical Road Repair Execution
    Contractor->>UI: Upload "After Repair" Compaction Photo
    UI->>API: POST /api/workorders/{id}/verify
    API->>API: AI Surface Smoothness Inspection (Score: 96.8%)
    API->>DB: Update Work Order -> Completed, Incident -> Resolved
    API-->>UI: WebSocket Broadcast: Anomaly Cleared!
```

---

## 🧩 Architectural Component Breakdown

| Layer | Technology | Primary Role |
|---|---|---|
| **Edge Hardware** | NVIDIA Jetson Nano / Raspberry Pi 4 | Low-power on-bus neural inference running YOLOv8n at 30 FPS. |
| **Backend Core** | FastAPI (Python 3.13), Uvicorn | High-throughput asynchronous REST & WebSocket ingestion. |
| **Database Abstraction** | PostgreSQL (`asyncpg`) / SQLite (`aiosqlite`) | Dual-mode resilience: cloud PostgreSQL for production, local SQLite for offline/demo zero-setup. |
| **Spatial Indexing** | Indexed B-Tree & Composite Coordinates | High-speed range queries across wards, severity levels, and contractor queues. |
| **GIS Mapping Engine** | React-Leaflet, Leaflet.js, OpenStreetMap | Dynamic risk heatmaps, live animated bus patrol fleet markers, and hazard-aware polylines. |
| **PDI Forecasting** | Time-series distress regression | Computes 0–100 Pavement Distress Index and 15d/30d wear forecasts per corridor. |
| **Routing Algorithm** | Anomaly-Weighted Dijkstra / Greedy Bypass | Bypasses severe potholes to generate smooth ambulance and commuter corridors. |
| **Field Dispatch** | WhatsApp URI Gateway & Webhook | Instant contractor dispatch with direct Google Maps turn navigation links. |
| **Security & Rate Limiter** | SlowAPI, JWT Bearer, bcrypt | 10 req/min auth rate limiting, role-based access control (Admin vs Field Agent). |
| **Client PWA** | Vite, TypeScript, Tailwind CSS, Service Worker | Offline-first Progressive Web App installable on mobile devices. |
```
