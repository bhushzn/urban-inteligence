# UrbanIntel AI — Cloud Deployment & Production Guide 🌐

> Complete step-by-step instructions for deploying the **UrbanIntel Smart City Command Center** (FastAPI + YOLOv8 + React + PostgreSQL) to free cloud hosting platforms for hackathon judges and real-time live demonstrations.

---

## 🏗️ Cloud Architecture Overview

```
                          ┌───────────────────────────┐
                          │     Vercel / Netlify      │
                          │   React + Leaflet + Vite  │
                          │   (urbanintel.vercel.app) │
                          └─────────────┬─────────────┘
                                        │
                         HTTPS REST /   │   WSS Secure WebSocket
                                        ▼
                          ┌───────────────────────────┐
                          │        Render.com         │
                          │     FastAPI + YOLOv8      │
                          │   (Docker Container)      │
                          └──────┬──────────────┬─────┘
                                 │              │
                   PostgreSQL /  │              │  Image CDN /
                                 ▼              ▼
                     ┌───────────────┐  ┌───────────────┐
                     │ Supabase/Neon │  │  Cloudinary   │
                     │  Cloud DB     │  │ Media Storage │
                     └───────────────┘  └───────────────┘
```

---

## Step 1: Free Cloud PostgreSQL (Supabase or Neon)

1. Sign up for free at [Supabase](https://supabase.com) or [Neon](https://neon.tech).
2. Create a new project (e.g. `urbanintel-prod`).
3. In **Database Settings**, copy the connection string:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
   ```
4. Save this URI; you will paste it as `DATABASE_URL` in the next step.

> [!NOTE]
> UrbanIntel AI automatically initializes all tables (`incidents`, `users`) and composite indexes on the first boot. No manual migration scripts are required!

---

## Step 2: Deploy Backend to Render.com

Render offers free hosting with native Docker support and WebSocket support.

### Option A: Using the Render Blueprint (`render.yaml`)
1. Fork or push your changes to your GitHub repository: [github.com/bhushzn/urban-inteligence](https://github.com/bhushzn/urban-inteligence).
2. Go to [Render Dashboard](https://dashboard.render.com) and click **New +** → **Blueprint**.
3. Select your repository. Render will automatically detect `render.yaml`.
4. Fill in the prompted environment variables:
   - `DATABASE_URL`: Your Supabase/Neon PostgreSQL URI from Step 1.
   - `CORS_ORIGINS`: `https://your-frontend.vercel.app,*`
   - `JWT_SECRET`: Any random 32-character string.
5. Click **Apply**.

### Option B: Manual Web Service Creation
1. Go to **New +** → **Web Service**.
2. Connect your GitHub repository.
3. Configure the service:
   - **Name:** `urbanintel-api`
   - **Environment:** `Docker`
   - **Region:** Choose closest to you (e.g., Oregon or Singapore)
   - **Branch:** `main`
   - **Docker Context:** `./backend`
   - **Dockerfile Path:** `./backend/Dockerfile`
   - **Plan:** Free
4. Add **Environment Variables**:
   | Variable | Value | Description |
   |---|---|---|
   | `PORT` | `10000` | Port for Render |
   | `DATABASE_URL` | `postgresql://...` | Cloud PostgreSQL URI |
   | `JWT_SECRET` | `<random-secure-string>` | Secret for JWT hashing |
   | `CORS_ORIGINS` | `*` or `https://urbanintel.vercel.app` | Allowed origins |
   | `CLOUDINARY_CLOUD_NAME` | *(Optional)* | Cloudinary cloud name |
   | `CLOUDINARY_API_KEY` | *(Optional)* | Cloudinary API key |
   | `CLOUDINARY_API_SECRET` | *(Optional)* | Cloudinary API secret |
5. Click **Deploy Web Service**.
6. Once deployed, test the live health endpoint:
   ```
   https://urbanintel-api.onrender.com/api/health
   ```
   You should see:
   ```json
   {
     "status": "healthy",
     "service": "UrbanIntel AI Command Center",
     "database": { "status": "connected", "engine": "PostgreSQL" }
   }
   ```

---

## Step 3: Deploy Frontend to Vercel

1. Go to [Vercel Dashboard](https://vercel.com) and click **Add New...** → **Project**.
2. Import your GitHub repository (`urban-inteligence`).
3. Under **Environment Variables**, add:
   | Key | Value | Example |
   |---|---|---|
   | `VITE_API_URL` | Your Render Backend URL | `https://urbanintel-api.onrender.com` |
4. Click **Deploy**.
5. In ~45 seconds, your command center dashboard will be live at:
   ```
   https://urbanintel.vercel.app
   ```

---

## Step 4: Run Full Stack Locally with Docker Compose

If you or a judge wish to run the entire system (FastAPI, React, and local PostgreSQL) in isolated containers without configuring Python or Node locally:

```bash
# 1. Clone repository
git clone https://github.com/bhushzn/urban-inteligence.git
cd urban-inteligence

# 2. Start all services (Backend + Frontend + PostgreSQL)
docker compose up --build
```

- **Frontend Dashboard:** [http://localhost:5173](http://localhost:5173) or [http://localhost](http://localhost)
- **FastAPI Backend:** [http://localhost:8000](http://localhost:8000)
- **Interactive API Docs:** [http://localhost:8000/docs](http://localhost:8000/docs)
- **Health Diagnostic:** [http://localhost:8000/api/health](http://localhost:8000/api/health)

---

## Step 5: Bus Dashcam Streaming in Cloud Mode

To stream real-time dashcam telemetry directly to your live cloud deployment:

Open `dashcam_simulator.py` and set:
```python
BACKEND_URL = "https://urbanintel-api.onrender.com/api/incidents"
```
Then run:
```bash
python dashcam_simulator.py
```
Frames captured from the camera will be transmitted directly across the internet to the cloud API, analyzed by YOLOv8, and live-broadcasted over WebSockets to any browser viewing your Vercel URL!

---

## 🛡️ Production Verification Checklist

- [x] Backend Dockerfile with OpenCV & PyTorch dependencies
- [x] Frontend dynamic API configuration with auto WebSocket protocol translation (`https` ↔ `wss`)
- [x] Dual-engine PostgreSQL/SQLite database support
- [x] Cloudinary CDN integration with local disk fallback
- [x] API rate limiting & brute-force attack prevention
- [x] Single Page Application (SPA) client-side rewrite rules (`vercel.json`, `nginx.conf`)
- [x] Live system health & telemetry diagnostics (`GET /api/health`)
