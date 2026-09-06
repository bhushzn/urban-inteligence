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

// ─── REST API ──────────────────────────────────────────────────────────────
export const api = {
  async getIncidents(): Promise<Incident[]> {
    const res = await fetch(`${BASE_URL}/api/incidents`);
    return res.json();
  },

  async verifyIncident(id: number): Promise<Incident> {
    const res = await fetch(`${BASE_URL}/api/incidents/${id}/verify`, { method: "PATCH" });
    return res.json();
  },

  async resolveIncident(id: number): Promise<Incident> {
    const res = await fetch(`${BASE_URL}/api/incidents/${id}/resolve`, { method: "PATCH" });
    return res.json();
  },

  async getAnalytics(): Promise<Analytics> {
    const res = await fetch(`${BASE_URL}/api/analytics`);
    return res.json();
  },

  async analyzeImage(file: File, category: string): Promise<AIResult> {
    const form = new FormData();
    form.append("image", file);
    form.append("category", category);
    const res = await fetch(`${BASE_URL}/api/analyze`, { method: "POST", body: form });
    return res.json();
  },

  async createIncident(data: FormData): Promise<Incident> {
    const res = await fetch(`${BASE_URL}/api/incidents`, { method: "POST", body: data });
    return res.json();
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

export const IMAGE_BASE = BASE_URL;
