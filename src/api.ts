// API Client for UrbanIntel AI Backend
const BASE_URL = "http://localhost:8000";
const WS_URL  = "ws://localhost:8000/ws";

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
}

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
}

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
const TOKEN_KEY = "urbanintel_token";
const USER_KEY = "urbanintel_user";

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): User | null {
  const raw = localStorage.getItem(USER_KEY);
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
};

// ─── WebSocket ─────────────────────────────────────────────────────────────
export type WSEvent =
  | { event: "new_incident";    data: Incident }
  | { event: "incident_updated"; data: Incident };

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
      console.log("[WS] Connected to UrbanIntel backend");
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
