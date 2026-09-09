// API Client for CityEye Backend
const getBaseUrl = (): string => {
  if (import.meta.env.VITE_API_URL !== undefined && import.meta.env.VITE_API_URL !== "") {
    return (import.meta.env.VITE_API_URL as string).replace(/\/+$/, "");
  }
  return import.meta.env.PROD ? "" : "http://localhost:8000";
};

export const BASE_URL = getBaseUrl();

// Auto-derive WebSocket URL (http -> ws, https -> wss)
const deriveWsUrl = (apiUrl: string): string => {
  if (import.meta.env.VITE_WS_URL) return import.meta.env.VITE_WS_URL as string;

  if (apiUrl && (apiUrl.startsWith("http://") || apiUrl.startsWith("https://"))) {
    const wsProto = apiUrl.startsWith("https://") ? "wss://" : "ws://";
    const host = apiUrl.replace(/^https?:\/\//, "").replace(/\/+$/, "");
    return `${wsProto}${host}/ws`;
  }

  // Same-origin fallback in browser when deployed with rewrites/proxies
  if (typeof window !== "undefined") {
    const wsProto = window.location.protocol === "https:" ? "wss://" : "ws://";
    return `${wsProto}${window.location.host}/ws`;
  }

  return "ws://localhost:8000/ws";
};

export const WS_URL = deriveWsUrl(BASE_URL);

export interface Incident {
  id: number;
  type: string;
  severity: "High" | "Medium" | "Low";
  lat: number;
  lng: number;
  ward: string;
  location: string;
  verified: boolean;
  resolved: boolean;
  category: string;
  image_url: string | null;
  confidence: number;
  bbox_x: number;
  bbox_y: number;
  bbox_w: number;
  bbox_h: number;
  created_at: string;
  timestamp_label: string;
  dispatched_to?: string | null;
  sla_deadline?: string | null;
  dispatch_notes?: string | null;
  after_image_url?: string | null;
  repair_score?: number | null;
}

export interface WorkOrder {
  id: number;
  incident_id: number;
  contractor_name: string;
  zone: string;
  priority: string;
  sla_hours: number;
  deadline: string;
  status: string;
  notes?: string;
  created_at: string;
  after_image_url?: string | null;
  repair_score?: number | null;
  verified_at?: string | null;
}

export interface CorridorPDI {
  id: string;
  name: string;
  length_km: number;
  daily_pcu: number;
  wards: string[];
  pdi_score: number;
  status: "Optimal" | "Moderate" | "Critical";
  status_color: string;
  active_anomalies: number;
  critical_count: number;
  forecast_15d: number;
  forecast_30d: number;
  repair_cost_inr: number;
  repair_cost_label: string;
  lat: number;
  lng: number;
  dominant_damage: string;
  jurisdiction: string;
  surface_type: string;
}

export interface CorridorAnalyticsResponse {
  city: string;
  monitored_corridors_count: number;
  total_lane_km: number;
  city_average_pdi: number;
  overall_status: "Optimal" | "Moderate" | "Critical";
  total_budget_inr: number;
  total_budget_label: string;
  corridors: CorridorPDI[];
}

export interface ContractorLeaderboardItem {
  name: string;
  dispatched: number;
  completed: number;
  compliance_pct: number;
  avg_quality_score: number;
  rating: string;
}

export interface AuditSummary {
  report_id: string;
  municipality: string;
  system: string;
  generated_at: string;
  reporting_cycle: string;
  total_lane_km_monitored: number;
  city_average_pdi: number;
  pdi_rating: "Optimal" | "Moderate" | "Critical";
  total_incidents_logged: number;
  resolved_incidents: number;
  resolution_percentage: number;
  critical_anomalies_active: number;
  contractor_compliance_rate: number;
  total_work_orders_dispatched: number;
  work_orders_completed: number;
  average_repair_turnaround_hrs: number;
  estimated_cost_savings: string;
  corridor_breakdown: CorridorPDI[];
  contractor_leaderboard: ContractorLeaderboardItem[];
}

export interface RepairVerificationResult {
  success: boolean;
  repair_quality_score: number;
  status: string;
  verified_at: string;
  inspector: string;
  work_order: WorkOrder;
  incident?: Incident;
}

export interface RouteOption {
  name: string;
  distance_km: number;
  duration_minutes: number;
  hazards_encountered: number;
  critical_potholes: number;
  smoothness_score: number;
  risk_score: number;
  status: string;
  waypoints: [number, number][];
  warning?: string;
  recommendation?: string;
}

export interface SafeRouteResponse {
  origin: string;
  destination: string;
  vehicle_type: string;
  origin_coords: [number, number];
  destination_coords: [number, number];
  fastest_route: RouteOption;
  safest_route: RouteOption;
  turn_guidance: { step: number; instruction: string; dist: string }[];
}

export interface ContractorNotificationResponse {
  success: boolean;
  work_order_id: number;
  contractor: string;
  channel: string;
  whatsapp_url: string;
  gps_navigation_url: string;
  message_preview: string;
  sent_at: string;
}

export interface KarmaProfile {
  citizen_name: string;
  karma_points: number;
  tier: string;
  total_reports_submitted: number;
  verified_reports_count: number;
  resolved_reports_count: number;
  co2_reduction_kg: number;
  leaderboard_rank: number;
  available_perks: { id: string; title: string; cost_points: number; status: string }[];
}

export interface EnvironmentalTelemetry {
  city: string;
  aqi: {
    value: number;
    category: "Good" | "Moderate" | "Poor" | "Hazardous";
    pm25: number;
    pm10: number;
    co: number;
    no2: number;
    trend: string;
  };
  temperature: {
    value: number;
    unit: string;
    humidity_pct: number;
    heat_index: number;
  };
  noise: {
    value: number;
    unit: string;
    status: string;
    peak_zone: string;
    peak_value: number;
  };
  crowd_density: {
    status: string;
    avg_bus_load_pct: number;
    peak_route: string;
    monitored_stations: number;
  };
  traffic_congestion: {
    status: string;
    avg_speed_kmh: number;
    congestion_index: string;
    active_chokepoints: string[];
  };
  bus_lane_enforcement: {
    status: string;
    active_obstructions: number;
    cleared_today: number;
    compliance_pct: number;
  };
  active_fleet_sensors: number;
  timestamp: string;
}

export const DEFAULT_TELEMETRY: EnvironmentalTelemetry = {
  city: "Bhopal Smart City",
  aqi: {
    value: 72,
    category: "Moderate",
    pm25: 22.4,
    pm10: 48.1,
    co: 0.8,
    no2: 18.5,
    trend: "stable",
  },
  temperature: {
    value: 31.8,
    unit: "°C",
    humidity_pct: 54,
    heat_index: 33.2,
  },
  noise: {
    value: 67.4,
    unit: "dB",
    status: "Normal",
    peak_zone: "MP Nagar Commercial Zone",
    peak_value: 78.2,
  },
  crowd_density: {
    status: "Moderate",
    avg_bus_load_pct: 64,
    peak_route: "BRTS Line-A (Roshanpura -> New Market)",
    monitored_stations: 34,
  },
  traffic_congestion: {
    status: "Normal",
    avg_speed_kmh: 24.5,
    congestion_index: "1.18x",
    active_chokepoints: ["Ayodhya Bypass Junction", "Board Office Sq"],
  },
  bus_lane_enforcement: {
    status: "Optimal",
    active_obstructions: 2,
    cleared_today: 11,
    compliance_pct: 94.2,
  },
  active_fleet_sensors: 24,
  timestamp: new Date().toISOString(),
};

export interface Analytics {
  total: number;
  resolved: number;
  verified: number;
  critical: number;
  pending: number;
  resolution_rate: number;
  active_buses: number;
  fleet_health: number;
  ward_breakdown: { ward: string; count: number }[];
  category_breakdown: { category: string; count: number }[];
  recent_trend: { hour: string; count: number }[];
}

export const DEFAULT_ANALYTICS: Analytics = {
  total: 48,
  resolved: 29,
  verified: 38,
  critical: 7,
  pending: 12,
  resolution_rate: 60.4,
  active_buses: 14,
  fleet_health: 96,
  ward_breakdown: [
    { ward: "Ward 1", count: 8 },
    { ward: "Ward 3", count: 12 },
    { ward: "Ward 5", count: 6 },
    { ward: "Ward 7", count: 11 },
    { ward: "Ward 12", count: 7 },
    { ward: "Ward 15", count: 4 },
  ],
  category_breakdown: [
    { category: "road", count: 22 },
    { category: "bus_lane", count: 14 },
    { category: "garbage", count: 11 },
    { category: "water", count: 7 },
    { category: "infrastructure", count: 5 },
    { category: "encroachment", count: 3 },
  ],
  recent_trend: [
    { hour: "06:00", count: 2 },
    { hour: "08:00", count: 7 },
    { hour: "10:00", count: 14 },
    { hour: "12:00", count: 9 },
    { hour: "14:00", count: 11 },
    { hour: "16:00", count: 5 },
  ],
};

export interface AIResult {
  type: string;
  severity: string;
  confidence: number;
  bbox: { x: number; y: number; w: number; h: number };
  model: string;
  processing_time_ms: number;
}

export interface User {
  id: number;
  username: string;
  name: string;
  role: "admin" | "field_agent";
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface SystemHealth {
  status: "healthy" | "degraded";
  service: string;
  version: string;
  uptime_seconds: number;
  timestamp: string;
  ai_engine: {
    loaded: boolean;
    model_name: string;
    status: string;
  };
  database: {
    status: string;
    engine: string;
    incidents_count?: number;
    users_count?: number;
    details?: string;
  };
  storage: {
    status: string;
    engine: string;
    cloudinary_configured: boolean;
    local_uploads_count: number;
  };
  active_websockets: number;
}

// ─── Token Management ──────────────────────────────────────────────────────
const TOKEN_KEY = "cityeye_token";
const USER_KEY = "cityeye_user";

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY) || localStorage.getItem("urbanintel_token");
}

export function getStoredUser(): User | null {
  const raw = localStorage.getItem(USER_KEY) || localStorage.getItem("urbanintel_user");
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setStoredAuth(token: string | null, user: User | null) {
  if (token && user) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem("urbanintel_token");
    localStorage.removeItem("urbanintel_user");
  }
}

function authHeaders(): Record<string, string> {
  const token = getStoredToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handleApiResponse(res: Response, fallbackError: string) {
  if (res.status === 429) {
    const err = await res.json().catch(() => ({ detail: "Too many requests" }));
    throw new Error(`⚠️ Rate limit reached: ${err.detail || "Please wait 60 seconds before retrying."}`);
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: fallbackError }));
    throw new Error(err.detail || err.error || fallbackError);
  }
  return res.json();
}

// ─── Image URL Resolver (Handles both Cloudinary & Local storage) ──────────
export const IMAGE_BASE = BASE_URL;

export function resolveImageUrl(pathOrUrl: string | null | undefined): string | null {
  if (!pathOrUrl) return null;
  if (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://")) {
    return pathOrUrl;
  }
  const cleanPath = pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`;
  return `${BASE_URL}${cleanPath}`;
}

/**
 * Automatically resizes and compresses high-resolution photos before upload.
 * - Downsamples large 12MP-48MP mobile photos to max 1920px width/height.
 * - Compresses to JPEG 0.85 quality (~400KB - 800KB).
 * - Converts Apple HEIC/HEIF or uncommon mobile formats to standard JPEG.
 * - Prevents 413 Payload Too Large / serverless payload limit errors on deployed sites.
 */
export async function optimizeImageForUpload(file: File, maxDim = 1920, quality = 0.85): Promise<File> {
  // If file is already under 1MB and is standard jpeg/png/webp, use directly
  if (file.size < 1024 * 1024 && ["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    return file;
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          return resolve(file);
        }

        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (!blob) return resolve(file);
            const safeName = file.name.replace(/\.[^/.]+$/, "") + ".jpg";
            const optimized = new File([blob], safeName, {
              type: "image/jpeg",
              lastModified: Date.now(),
            });
            resolve(optimized);
          },
          "image/jpeg",
          quality
        );
      };
      img.onerror = () => resolve(file);
      img.src = e.target?.result as string;
    };
    reader.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
}

// ─── REST API ──────────────────────────────────────────────────────────────
export const api = {
  // Auth
  async login(username: string, password: string): Promise<AuthResponse> {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const data: AuthResponse = await handleApiResponse(res, "Login failed");
    setStoredAuth(data.access_token, data.user);
    return data;
  },

  async register(username: string, password: string, name: string, role: string = "field_agent"): Promise<AuthResponse> {
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password, name, role }),
    });
    const data: AuthResponse = await handleApiResponse(res, "Registration failed");
    setStoredAuth(data.access_token, data.user);
    return data;
  },

  async getMe(): Promise<User | null> {
    const token = getStoredToken();
    if (!token) return null;
    try {
      const res = await fetch(`${BASE_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        setStoredAuth(null, null);
        return null;
      }
      const data = await res.json();
      setStoredAuth(token, data.user);
      return data.user;
    } catch {
      return null;
    }
  },

  logout() {
    setStoredAuth(null, null);
  },

  // Health / Telemetry
  async getHealth(): Promise<SystemHealth> {
    const res = await fetch(`${BASE_URL}/api/health`);
    return handleApiResponse(res, "Failed to fetch system diagnostics");
  },

  // Incidents
  async getIncidents(): Promise<Incident[]> {
    const res = await fetch(`${BASE_URL}/api/incidents`, {
      headers: { ...authHeaders() },
    });
    return handleApiResponse(res, "Failed to load incidents");
  },

  async verifyIncident(id: number): Promise<Incident> {
    const res = await fetch(`${BASE_URL}/api/incidents/${id}/verify`, {
      method: "PATCH",
      headers: { ...authHeaders() },
    });
    return handleApiResponse(res, "Failed to verify incident");
  },

  async resolveIncident(id: number): Promise<Incident> {
    const res = await fetch(`${BASE_URL}/api/incidents/${id}/resolve`, {
      method: "PATCH",
      headers: { ...authHeaders() },
    });
    return handleApiResponse(res, "Failed to resolve incident");
  },
  async deleteIncident(id: number): Promise<{ success: boolean; deleted_id: number }> {
    try {
      const res = await fetch(`${BASE_URL}/api/incidents/${id}`, {
        method: "DELETE",
        headers: { ...authHeaders() },
      });
      if (res.status === 405 || !res.ok) {
        const fallback = await fetch(`${BASE_URL}/api/incidents/${id}/delete`, {
          method: "POST",
          headers: { ...authHeaders() },
        });
        return handleApiResponse(fallback, "Failed to delete incident");
      }
      return handleApiResponse(res, "Failed to delete incident");
    } catch {
      const fallback = await fetch(`${BASE_URL}/api/incidents/${id}/delete`, {
        method: "POST",
        headers: { ...authHeaders() },
      });
      return handleApiResponse(fallback, "Failed to delete incident");
    }
  },

  async deleteIncidentImage(id: number): Promise<{ success: boolean; incident: Incident; message: string }> {
    try {
      const res = await fetch(`${BASE_URL}/api/incidents/${id}/image`, {
        method: "DELETE",
        headers: { ...authHeaders() },
      });
      if (res.status === 405 || !res.ok) {
        const fallback = await fetch(`${BASE_URL}/api/incidents/${id}/delete-image`, {
          method: "POST",
          headers: { ...authHeaders() },
        });
        return handleApiResponse(fallback, "Failed to delete incident image");
      }
      return handleApiResponse(res, "Failed to delete incident image");
    } catch {
      const fallback = await fetch(`${BASE_URL}/api/incidents/${id}/delete-image`, {
        method: "POST",
        headers: { ...authHeaders() },
      });
      return handleApiResponse(fallback, "Failed to delete incident image");
    }
  },

  async dispatchIncident(id: number, data: {
    contractor_name: string;
    zone: string;
    priority?: string;
    sla_hours?: number;
    notes?: string;
  }): Promise<{ success: boolean; work_order: WorkOrder; incident: Incident }> {
    const res = await fetch(`${BASE_URL}/api/incidents/${id}/dispatch`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders(),
      },
      body: JSON.stringify(data),
    });
    return handleApiResponse(res, "Failed to dispatch contractor crew");
  },

  async getWorkOrders(): Promise<{
    total_dispatched: number;
    completed: number;
    in_progress: number;
    sla_compliance_rate: number;
    work_orders: WorkOrder[];
  }> {
    const res = await fetch(`${BASE_URL}/api/workorders`, {
      headers: { ...authHeaders() },
    });
    return handleApiResponse(res, "Failed to fetch work orders");
  },

  async getAnalytics(): Promise<Analytics> {
    const res = await fetch(`${BASE_URL}/api/analytics`, {
      headers: { ...authHeaders() },
    });
    return handleApiResponse(res, "Failed to fetch analytics");
  },

  async analyzeImage(file: File, category: string): Promise<AIResult> {
    const form = new FormData();
    form.append("image", file);
    form.append("category", category);
    const res = await fetch(`${BASE_URL}/api/analyze`, {
      method: "POST",
      headers: { ...authHeaders() },
      body: form,
    });
    return handleApiResponse(res, "AI analysis request failed");
  },

  async createIncident(data: FormData): Promise<Incident> {
    const res = await fetch(`${BASE_URL}/api/incidents`, {
      method: "POST",
      headers: { ...authHeaders() },
      body: data,
    });
    return handleApiResponse(res, "Failed to submit incident report");
  },

  async getCorridorAnalytics(): Promise<CorridorAnalyticsResponse> {
    const res = await fetch(`${BASE_URL}/api/analytics/corridors`, {
      headers: { ...authHeaders() },
    });
    return handleApiResponse(res, "Failed to fetch corridor analytics");
  },

  async verifyRepair(orderId: number, data: FormData): Promise<RepairVerificationResult> {
    const res = await fetch(`${BASE_URL}/api/workorders/${orderId}/verify`, {
      method: "POST",
      headers: { ...authHeaders() },
      body: data,
    });
    return handleApiResponse(res, "Failed to verify repair");
  },

  async getAuditSummary(): Promise<AuditSummary> {
    const res = await fetch(`${BASE_URL}/api/reports/audit-summary`, {
      headers: { ...authHeaders() },
    });
    return handleApiResponse(res, "Failed to generate executive audit report");
  },

  async calculateSafeRoute(origin: string, destination: string, vehicleType: string = "ambulance"): Promise<SafeRouteResponse> {
    const res = await fetch(`${BASE_URL}/api/routing/safe-route`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ origin, destination, vehicle_type: vehicleType }),
    });
    return handleApiResponse(res, "Failed to calculate safe route");
  },

  async notifyContractor(orderId: number): Promise<ContractorNotificationResponse> {
    const res = await fetch(`${BASE_URL}/api/workorders/${orderId}/notify`, {
      method: "POST",
      headers: { ...authHeaders() },
    });
    return handleApiResponse(res, "Failed to dispatch contractor notification");
  },

  async getCitizenKarma(): Promise<KarmaProfile> {
    const res = await fetch(`${BASE_URL}/api/citizen/karma`, {
      headers: { ...authHeaders() },
    });
    return handleApiResponse(res, "Failed to fetch citizen karma profile");
  },

  async getEnvironmentalTelemetry(): Promise<EnvironmentalTelemetry> {
    try {
      const res = await fetch(`${BASE_URL}/api/telemetry/environmental`);
      if (!res.ok) return DEFAULT_TELEMETRY;
      return res.json();
    } catch {
      return DEFAULT_TELEMETRY;
    }
  },

  async anonymizeImage(file: File): Promise<{
    success: boolean;
    dpdp_compliant: boolean;
    anonymized_regions: { type: string; x: number; y: number; w: number; h: number }[];
    image_base64: string;
  }> {
    const form = new FormData();
    form.append("image", file);
    const res = await fetch(`${BASE_URL}/api/anonymize`, {
      method: "POST",
      headers: { ...authHeaders() },
      body: form,
    });
    return handleApiResponse(res, "Anonymization failed");
  },
};

// ─── WebSocket ─────────────────────────────────────────────────────────────
export type WSEvent =
  | { event: "new_incident";        data: Incident }
  | { event: "incident_updated";    data: Incident }
  | { event: "incident_resolved";   data: Incident }
  | { event: "incident_deleted";    data: { id: number } }
  | { event: "work_order_verified"; data: WorkOrder };

export function connectWebSocket(
  onMessage: (e: WSEvent) => void,
  onConnect?: () => void,
  onDisconnect?: () => void,
): () => void {
  let ws: WebSocket | null = null;
  let closed = false;

  function connect() {
    if (closed) return;
    ws = new WebSocket(WS_URL);

    ws.onopen = () => {
      console.log("[WS] Connected to CityEye backend");
      onConnect?.();
    };

    ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data) as WSEvent;
        onMessage(data);
      } catch {
        // ignore parse errors
      }
    };

    ws.onclose = () => {
      onDisconnect?.();
      // Auto-reconnect after 3s
      if (!closed) setTimeout(connect, 3000);
    };

    ws.onerror = () => ws?.close();
  }

  connect();
  return () => {
    closed = true;
    ws?.close();
  };
}
