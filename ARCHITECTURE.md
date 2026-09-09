# CityEye — End-to-End System Architecture 🏗️

> **Smart India Hackathon (SIH) • Problem Statement 26124**  
> *Autonomous Road Hazard, Transit Fleet Sensing & Municipal Dispatch Platform*  
> *Municipal Deployment Focus: **Vidisha, Madhya Pradesh** (`23.5230° N, 77.8120° E`)*

---

## 🏛️ High-Level System Architecture

```mermaid
flowchart TB
    subgraph SENSING["1. SENSING & CAPTURE LAYER"]
        BusCam["🚌 Vidisha Public Transit Dashcams\n(dashcam_simulator.py • 25 FPS)"]
        MobileCam["📱 Mobile Field Camera\n(BusCameraModal.tsx • QR / LAN Stream)"]
        CitizenApp["📱 Citizen Reporting Portal\n(ReportModal.tsx • Live GPS & EXIF)"]
        EdgeInference["⚡ Edge Processing Unit\n(NVIDIA Jetson Nano / Laptop Core)"]
        BusCam --> EdgeInference
    end

    subgraph GATEWAY["2. INGESTION & GATEWAY LAYER (FastAPI)"]
        ActiveStreamGuard["🛡️ Active Stream Guard\n(Rejects Inactive / Black Frames)"]
        ExifParser["📍 Hardware EXIF GPS Extractor\n(DMS to Decimal Degrees Parser)"]
        RateLimiter["⏳ SlowAPI Rate Limiter\n(120 req/min • DDoS Protection)"]
        MagicBytesFilter["🔍 Magic-Byte File Validator\n(JPEG / PNG / WebP Header Inspection)"]
        
        EdgeInference -->|Multipart POST < 150KB| ActiveStreamGuard
        MobileCam --> ActiveStreamGuard
        CitizenApp --> ExifParser
        ActiveStreamGuard --> MagicBytesFilter
        ExifParser --> MagicBytesFilter
        MagicBytesFilter --> RateLimiter
    end

    subgraph AI_PIPELINE["3. COMPUTER VISION & INTELLIGENCE PIPELINE"]
        YoloModel["🧠 YOLOv8 Multi-Class Classifier\n(Indian Road Anomaly Dataset)"]
        ConfidenceFilter["🎯 Confidence Gate (tau >= 0.10)\nSeverity & Dynamic Category Assign"]
        SpatialDedupe["📐 Spatial Deduplication Engine\n(5-Meter Radius Proximity Cluster)"]
        
        RateLimiter --> YoloModel
        YoloModel --> ConfidenceFilter
        ConfidenceFilter --> SpatialDedupe
    end

    subgraph PERSISTENCE["4. STORAGE & DATA ABSTRACTION LAYER"]
        DualDB[("🗄️ Database Abstraction Engine\nPostgreSQL asyncpg / SQLite aiosqlite")]
        DiskStorage["☁️ Storage Manager\n(Local Disk / Cloudinary CDN Fallback)"]
        
        SpatialDedupe --> DualDB
        SpatialDedupe --> DiskStorage
    end

    subgraph BROADCAST["5. REAL-TIME EVENT BROADCAST"]
        WebSocketHub["📡 WebSocket Broadcast Hub\n(Full-Duplex sub-50ms Delivery)"]
        DualDB --> WebSocketHub
    end

    subgraph COMMAND_CENTER["6. MUNICIPAL COMMAND CENTER & CONSUMERS"]
        GoogleMapUI["🗺️ Google Maps GIS Interface\n(Streets / Satellite / Dark • Vidisha Corridors)"]
        PdiForecaster["📊 PDI Corridor Analytics Engine\n(Monsoon Stress Simulator • 15d/30d Wear)"]
        SafeRouteEngine["🧭 Safe-Route Emergency Router\n(Fastest vs Safest Hazard Bypass)"]
        WhatsAppGateway["📲 WhatsApp Contractor SLA Dispatch\n(Direct Google Maps Turn Navigation Links)"]
        PowVerifier["🛠️ Proof-of-Work Verification AI\n(Before/After Surface Compaction Scorer)"]
        
        WebSocketHub --> GoogleMapUI
        DualDB --> PdiForecaster
        DualDB --> SafeRouteEngine
        DualDB --> WhatsAppGateway
        WhatsAppGateway --> PowVerifier
    end
```

---

## 🔄 End-to-End Operational Lifecycle Sequence

```mermaid
sequenceDiagram
    autonumber
    actor Bus as 🚌 Vidisha Transit Bus
    actor Citizen as 📱 Citizen / Commuter
    participant API as 🚀 CityEye API (FastAPI)
    participant DB as 🗄️ Database & Spatial Index
    participant UI as 🖥️ Command Center
    actor Admin as 👨‍💼 Municipal Admin
    actor Contractor as 👷 PWD Repair Crew

    Note over Bus,Citizen: Anomaly Encountered in Vidisha
    alt Bus Dashcam Detection
        Bus->>API: Edge Telemetry (YOLOv8 BBox + Live GPS)
    else Citizen Grievance
        Citizen->>API: Mobile PWA Upload (Hardware EXIF GPS + Photo)
    end

    API->>API: Validate Stream (Reject Black/Inactive Frames)
    API->>API: YOLOv8 Inference & Severity Classification
    API->>DB: Store Incident & Deduplicate (5m radius)
    API-->>UI: WebSocket Broadcast ('new_incident' event)
    UI-->>Admin: Pin Red Marker on Google Map & Trigger Chime

    Admin->>UI: Select Incident & Assign Contractor (24h SLA)
    UI->>API: POST /api/incidents/{id}/dispatch
    API->>Contractor: WhatsApp Dispatch (Google Maps GPS Link + Photo)

    Note over Contractor: Physical Road Repair Execution
    Contractor->>UI: Upload "After Repair" Compaction Photo
    UI->>API: POST /api/workorders/{id}/verify
    API->>API: AI Surface Smoothness Inspection (Score: 96.8%)
    API->>DB: Update Work Order -> Completed, Incident -> Resolved
    API-->>UI: WebSocket Broadcast ('incident_resolved')
    UI-->>Admin: Marker Turns Green & PDI Corridor Health Recalculated
```

---

## 🗂️ Database Entity Relationship Diagram (ERD)

```mermaid
erDiagram
    INCIDENTS {
        int id PK
        string type
        string severity
        float lat
        float lng
        string ward
        string location
        int verified
        int resolved
        string category
        string image_path
        float confidence
        float bbox_x
        float bbox_y
        float bbox_w
        float bbox_h
        timestamp created_at
        string timestamp_label
        string dispatched_to
        string sla_deadline
        string dispatch_notes
        string after_image_path
        float repair_score
    }

    USERS {
        int id PK
        string username UK
        string password
        string name
        string role
    }

    WORK_ORDERS {
        int id PK
        int incident_id FK
        string contractor_name
        string zone
        string priority
        int sla_hours
        string deadline
        string status
        string notes
        timestamp created_at
        string after_image_path
        float repair_score
        string verified_at
    }

    INCIDENTS ||--o| WORK_ORDERS : "dispatches to"
    USERS ||--o{ INCIDENTS : "triages / reports"
```

---

## 🚦 Incident State Transition Diagram

```mermaid
stateDiagram-v2
    [*] --> Ingested: Camera / Dashcam Capture
    Ingested --> Validated: Stream Active & Magic Bytes Verified
    Ingested --> Rejected: Inactive / Black Frame Detected
    Rejected --> [*]

    Validated --> AI_Analyzed: YOLOv8 Inference Completed
    AI_Analyzed --> Unverified: Logged in Database (Open)
    
    Unverified --> Verified: Admin Review & Confirmation
    Verified --> Dispatched: Contractor Assigned & SLA Started
    
    Dispatched --> In_Progress: Contractor Dispatched via WhatsApp
    In_Progress --> Under_Verification: Contractor Uploads 'After Photo'
    
    Under_Verification --> Resolved: Proof-of-Work Score >= 85%
    Under_Verification --> In_Progress: Proof-of-Work Rejected (< 85%)
    
    Resolved --> [*]: Archived in Municipal Ledger
```

---

## 🧩 Architectural Component Breakdown

| Layer | Technology | Primary Role |
|---|---|---|
| **Edge Hardware** | NVIDIA Jetson Nano / Raspberry Pi 4 / Laptop | Low-power on-bus neural inference running YOLOv8 at 25–30 FPS. |
| **Backend Core** | FastAPI (Python 3.12+), Uvicorn | High-throughput asynchronous REST & WebSocket ingestion. |
| **Database Abstraction** | PostgreSQL (`asyncpg`) / SQLite (`aiosqlite`) | Dual-mode resilience: cloud PostgreSQL for production, local SQLite for offline/demo zero-setup. |
| **Spatial Indexing** | Indexed B-Tree & Composite Coordinates | High-speed range queries across wards, severity levels, and contractor queues. |
| **GIS Mapping Engine** | React-Leaflet, Google Maps Tiles | Streets, Satellite Hybrid, and Dark GIS layers with Vidisha transit corridors. |
| **PDI Forecasting** | Time-series distress regression | Computes 0–100 Pavement Distress Index and 15d/30d wear forecasts per corridor. |
| **Routing Algorithm** | Anomaly-Weighted Dijkstra / Greedy Bypass | Bypasses severe potholes to generate smooth ambulance and commuter corridors. |
| **Field Dispatch** | WhatsApp URI Gateway & Webhook | Instant contractor dispatch with direct Google Maps turn navigation links. |
| **Security & Rate Limiter** | SlowAPI, JWT Bearer, bcrypt | 120 req/min general, 10 req/min auth brute-force protection. |
| **Client PWA** | Vite, TypeScript, Tailwind CSS, Service Worker | Offline-first Progressive Web App installable on mobile devices. |
