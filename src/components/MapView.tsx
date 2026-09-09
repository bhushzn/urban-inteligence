import { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Incident, SafeRouteResponse } from "../api";
import { resolveImageUrl } from "../api";

// Fix Leaflet default icon issue with Vite
import iconUrl from "leaflet/dist/images/marker-icon.png";
import iconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
import shadowUrl from "leaflet/dist/images/marker-shadow.png";
L.Icon.Default.mergeOptions({ iconUrl, iconRetinaUrl, shadowUrl });

// Custom coloured circle markers
function makeIcon(color: string, size = 16) {
  return L.divIcon({
    className: "",
    html: `
      <div style="
        width:${size}px;height:${size}px;
        background:${color};
        border:2px solid rgba(255,255,255,0.85);
        border-radius:50%;
        box-shadow:0 0 12px ${color}, 0 0 24px ${color}66;
        position:relative;
      ">
        <div style="
          position:absolute;inset:-6px;
          border-radius:50%;
          border:2px solid ${color}66;
          animation:ping 1.5s ease-out infinite;
        "></div>
      </div>
      <style>@keyframes ping{0%{transform:scale(1);opacity:.8}100%{transform:scale(2.5);opacity:0}}</style>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function makeBusIcon(busNum: string, speed: number) {
  return L.divIcon({
    className: "",
    html: `
      <div style="
        display:inline-flex;
        align-items:center;
        gap:6px;
        background:rgba(15,23,42,0.95);
        border:1.5px solid #38bdf8;
        padding:3px 8px;
        border-radius:12px;
        box-shadow:0 0 12px rgba(56,189,248,0.4);
        color:#fff;
        font-family:Inter,sans-serif;
        font-size:10px;
        font-weight:700;
        white-space:nowrap;
        transform:translate(-50%, -50%);
      ">
        <span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:#38bdf8;box-shadow:0 0 6px #38bdf8;"></span>
        <span>🚌 ${busNum}</span>
        <span style="color:#94a3b8;font-size:9px;">${speed}km/h</span>
      </div>
    `,
    iconSize: [84, 24],
    iconAnchor: [42, 12],
  });
}

function makeBRTSIcon(label: string, status: "clear" | "warning") {
  const isWarn = status === "warning";
  const bg = isWarn ? "#ef4444" : "#10b981";
  const icon = isWarn ? "⚠️" : "🚌";
  return L.divIcon({
    className: "",
    html: `
      <div style="
        display:inline-flex;
        align-items:center;
        gap:4px;
        background:rgba(15,23,42,0.92);
        border:1.5px solid ${bg};
        border-radius:9999px;
        padding:2px 8px;
        box-shadow:0 0 12px ${bg}88;
        white-space:nowrap;
        transform:translate(-50%, -50%);
      ">
        <span style="font-size:10px;">${icon}</span>
        <span style="color:#f8fafc;font-size:10px;font-weight:700;font-family:Inter,sans-serif;">${label}</span>
      </div>
    `,
    iconSize: [110, 24],
    iconAnchor: [55, 12],
  });
}

const ICONS = {
  High:   makeIcon("#ef4444", 18),
  Medium: makeIcon("#fbbf24", 16),
  Low:    makeIcon("#22d3ee", 14),
};

function PanTo({ incident }: { incident: Incident | null }) {
  const map = useMap();
  useEffect(() => {
    if (incident) {
      map.flyTo([incident.lat, incident.lng], 16, { duration: 1.5 });
    }
  }, [incident, map]);
  return null;
}

function MapController({ flyTarget }: { flyTarget: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (flyTarget) {
      map.flyTo(flyTarget, 15, { duration: 1.2 });
    }
  }, [flyTarget, map]);
  return null;
}

interface Props {
  incidents: Incident[];
  activeIncident: Incident | null;
  onMarkerClick: (inc: Incident) => void;
  mapLayers: { heatmap: boolean; fleet: boolean; potholes: boolean; busLane?: boolean };
  onToggleLayer: (layer: "heatmap" | "fleet" | "potholes" | "busLane") => void;
  activeRoute?: SafeRouteResponse | null;
  onClearRoute?: () => void;
}

// Vidisha city centre (Madhav Ganj / Station Road / Neemtal)
const VIDISHA_CENTER: [number, number] = [23.5230, 77.8120];

// Dedicated Vidisha Transit Corridors
const BRTS_CORRIDORS: [number, number][][] = [
  // Corridor 1: Sanchi Highway Link ➔ Neemtal ➔ Madhav Ganj ➔ Vidisha Railway Station
  [
    [23.5050, 77.7750],
    [23.5130, 77.7920],
    [23.5190, 77.8064],
    [23.5240, 77.8115],
    [23.5226, 77.8148],
  ],
  // Corridor 2: Ahmedpur Road ➔ Durga Nagar ➔ Betwa River Ghats
  [
    [23.5350, 77.8100],
    [23.5280, 77.8110],
    [23.5226, 77.8148],
    [23.5170, 77.8171],
    [23.5290, 77.8250],
  ],
];

const BRTS_CHECKPOINTS = [
  {
    id: "brts-1",
    name: "Madhav Ganj Hub",
    coords: [23.5240, 77.8115] as [number, number],
    status: "clear" as const,
    compliance: "98% Clear",
    desc: "Active AI Camera Unit VD-101 scanning lane",
  },
  {
    id: "brts-2",
    name: "Neemtal Chokepoint",
    coords: [23.5190, 77.8064] as [number, number],
    status: "warning" as const,
    compliance: "Encroachment Alert",
    desc: "Vegetable market obstruction detected in transit corridor",
  },
  {
    id: "brts-3",
    name: "Station Road Lane",
    coords: [23.5226, 77.8148] as [number, number],
    status: "clear" as const,
    compliance: "96% Clear",
    desc: "Smooth transit speed: 34 km/h average",
  },
];

// Simulated Transit Bus Fleet with accurate Vidisha live routes
interface BusVehicle {
  id: string;
  number: string;
  route: string;
  lat: number;
  lng: number;
  speed: number;
  deltaLat: number;
  deltaLng: number;
}

const INITIAL_BUSES: BusVehicle[] = [
  { id: "b1", number: "101", route: "Sanchi Rd ➔ Madhav Ganj", lat: 23.5150, lng: 77.7950, speed: 32, deltaLat: 0.0004, deltaLng: 0.0005 },
  { id: "b2", number: "202", route: "Station Rd ➔ Neemtal", lat: 23.5226, lng: 77.8148, speed: 28, deltaLat: -0.0004, deltaLng: -0.0003 },
  { id: "b3", number: "303", route: "Ahmedpur Rd ➔ Collectorate", lat: 23.5310, lng: 77.8080, speed: 35, deltaLat: -0.0005, deltaLng: 0.0002 },
  { id: "b4", number: "404", route: "Durga Nagar ➔ Betwa Ghats", lat: 23.5170, lng: 77.8171, speed: 30, deltaLat: 0.0003, deltaLng: 0.0004 },
];

export default function MapView({
  incidents,
  activeIncident,
  onMarkerClick,
  mapLayers,
  onToggleLayer,
  activeRoute,
  onClearRoute,
}: Props) {
  const mapRef = useRef<L.Map | null>(null);
  const [mapStyle, setMapStyle] = useState<"google-streets" | "google-hybrid" | "dark">("google-streets");
  const [buses, setBuses] = useState<BusVehicle[]>(INITIAL_BUSES);
  const [flyTarget, setFlyTarget] = useState<[number, number] | null>(null);

  // Animate transit bus fleet positions along corridors
  useEffect(() => {
    if (!mapLayers.fleet) return;
    const interval = setInterval(() => {
      setBuses(prev => prev.map(bus => {
        let newLat = bus.lat + bus.deltaLat;
        let newLng = bus.lng + bus.deltaLng;
        let deltaLat = bus.deltaLat;
        let deltaLng = bus.deltaLng;

        // Bounce back if moved too far from Vidisha center
        if (Math.abs(newLat - VIDISHA_CENTER[0]) > 0.025) deltaLat = -deltaLat;
        if (Math.abs(newLng - VIDISHA_CENTER[1]) > 0.025) deltaLng = -deltaLng;

        const jitterSpeed = Math.max(20, Math.min(48, bus.speed + Math.floor(Math.random() * 5 - 2)));
        return {
          ...bus,
          lat: newLat,
          lng: newLng,
          speed: jitterSpeed,
          deltaLat,
          deltaLng
        };
      }));
    }, 2500);

    return () => clearInterval(interval);
  }, [mapLayers.fleet]);

  const visibleIncidents = incidents.filter((inc) => {
    if (!mapLayers.potholes && inc.category === "road") return false;
    // Don't show incidents without real images
    if (!inc.image_url) return false;
    return true;
  });

  return (
    <div className="glass glow-cyan rounded-2xl overflow-hidden relative flex flex-col" style={{ minHeight: "480px" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/40 z-10 relative bg-slate-900/60">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-cyan-400 blink" />
          <span className="text-sm font-semibold text-slate-200 font-display">GIS Command Map</span>
          <span className="text-xs text-slate-400 ml-1 font-medium">— Vidisha, Madhya Pradesh • LIVE</span>
        </div>
        <div className="flex items-center gap-2">
          {/* Quick Vidisha Landmarks Focus */}
          <div className="hidden sm:flex items-center gap-1 bg-slate-800/40 border border-slate-700/40 px-2 py-1 rounded-lg text-[11px]">
            <span className="text-slate-500 font-semibold mr-1">Focus:</span>
            {[
              { name: "Madhav Ganj", coords: [23.5240, 77.8115] as [number, number] },
              { name: "Station Rd", coords: [23.5226, 77.8148] as [number, number] },
              { name: "Neemtal", coords: [23.5190, 77.8064] as [number, number] },
              { name: "Durga Nagar", coords: [23.5170, 77.8171] as [number, number] },
              { name: "Sanchi Rd", coords: [23.5050, 77.7750] as [number, number] },
            ].map(w => (
              <button
                key={w.name}
                onClick={() => setFlyTarget(w.coords)}
                className="px-1.5 py-0.5 rounded text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 transition-colors"
              >
                {w.name}
              </button>
            ))}
          </div>

          {/* Map Layer Switcher: Google Map vs Satellite vs Dark */}
          <div className="flex items-center gap-1 bg-slate-800/70 p-0.5 rounded-lg border border-slate-700/60 text-[11px]">
            <button
              onClick={() => setMapStyle("google-streets")}
              title="Actual Google Maps Streets view"
              className={`flex items-center gap-1 px-2 py-0.5 rounded-md font-semibold transition-all ${
                mapStyle === "google-streets" ? "bg-cyan-500 text-slate-950 shadow-sm" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <span>🗺️</span>
              <span>Google Map</span>
            </button>
            <button
              onClick={() => setMapStyle("google-hybrid")}
              title="Google Maps Satellite Hybrid view"
              className={`flex items-center gap-1 px-2 py-0.5 rounded-md font-semibold transition-all ${
                mapStyle === "google-hybrid" ? "bg-cyan-500 text-slate-950 shadow-sm" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <span>🛰️</span>
              <span>Satellite</span>
            </button>
            <button
              onClick={() => setMapStyle("dark")}
              title="Tactical Dark GIS Canvas"
              className={`flex items-center gap-1 px-2 py-0.5 rounded-md font-semibold transition-all ${
                mapStyle === "dark" ? "bg-cyan-500 text-slate-950 shadow-sm" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <span>🌙</span>
              <span>Dark</span>
            </button>
          </div>

          {/* Legend */}
          {[
            { label: "High", color: "#ef4444" },
            { label: "Medium", color: "#fbbf24" },
            { label: "Low", color: "#22d3ee" },
          ].map((l) => (
            <div key={l.label} className="flex items-center gap-1 text-xs text-slate-400 ml-1">
              <div className="w-2 h-2 rounded-full" style={{ background: l.color }} />
              {l.label}
            </div>
          ))}
        </div>
      </div>

      {/* Map Canvas */}
      <div className="relative flex-1" style={{ minHeight: "400px" }}>
        <MapContainer
          center={VIDISHA_CENTER}
          zoom={14}
          style={{ height: "100%", width: "100%", background: mapStyle.startsWith("google") ? "#e5e3df" : "#0a0f1e" }}
          ref={mapRef as React.RefObject<L.Map>}
          zoomControl={true}
        >
          {/* Active Google Map / Satellite / Dark Tile Layer */}
          <TileLayer
            key={mapStyle}
            url={
              mapStyle === "google-streets"
                ? "https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
                : mapStyle === "google-hybrid"
                ? "https://{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
                : (import.meta.env.VITE_MAP_TILE_URL as string) ||
                  (import.meta.env.VITE_CARTO_API_KEY
                    ? `https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png?api_key=${import.meta.env.VITE_CARTO_API_KEY}`
                    : "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}")
            }
            subdomains={mapStyle.startsWith("google") ? ["mt0", "mt1", "mt2", "mt3"] : ["a", "b", "c"]}
            maxZoom={20}
            attribution={mapStyle.startsWith("google") ? '&copy; Google Maps' : '&copy; Esri &copy; OpenStreetMap'}
          />

          {/* Programmatic Navigation */}
          <PanTo incident={activeIncident} />
          <MapController flyTarget={flyTarget} />

          {/* Dynamic Risk Density Heatmap Circles Layer */}
          {mapLayers.heatmap && visibleIncidents.map((inc) => {
            if (inc.resolved) return null;
            const isHigh = inc.severity === "High";
            return (
              <Circle
                key={`heat-${inc.id}`}
                center={[inc.lat, inc.lng]}
                radius={isHigh ? 450 : 320}
                pathOptions={{
                  color: isHigh ? "#ef4444" : "#f59e0b",
                  fillColor: isHigh ? "#ef4444" : "#f59e0b",
                  fillOpacity: isHigh ? 0.32 : 0.22,
                  weight: 1,
                }}
              />
            );
          })}

          {/* Live Bus Fleet Tracking Layer */}
          {mapLayers.fleet && buses.map((bus) => (
            <Marker
              key={bus.id}
              position={[bus.lat, bus.lng]}
              icon={makeBusIcon(bus.number, bus.speed)}
            >
              <Popup className="urban-popup">
                <div style={{ fontFamily: "Inter, sans-serif", minWidth: "190px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
                    <span style={{ fontWeight: 700, color: "#38bdf8", fontSize: "13px" }}>Bus #{bus.number}</span>
                    <span style={{ background: "rgba(34,197,94,0.2)", color: "#4ade80", border: "1px solid rgba(34,197,94,0.4)", borderRadius: "4px", padding: "1px 4px", fontSize: "10px", fontWeight: 600 }}>
                      CAM ACTIVE
                    </span>
                  </div>
                  <p style={{ color: "#e2e8f0", fontSize: "12px", margin: "2px 0", fontWeight: 600 }}>{bus.route}</p>
                  <p style={{ color: "#94a3b8", fontSize: "11px", margin: "2px 0" }}>⚡ Telemetry: {bus.speed} km/h • GPS Active</p>
                  <p style={{ color: "#94a3b8", fontSize: "11px", margin: "2px 0" }}>🎥 Feed: 1080p @ 30fps • Edge AI Active</p>
                  <p style={{ color: "#64748b", fontSize: "10px", marginTop: "4px" }}>Patrol Rover • Bhopal Municipal Transit</p>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Incident markers */}
          {visibleIncidents.map((inc) => (
            <Marker
              key={inc.id}
              position={[inc.lat, inc.lng]}
              icon={ICONS[inc.severity] ?? ICONS.Low}
              eventHandlers={{ click: () => onMarkerClick(inc) }}
            >
              <Popup className="urban-popup">
                <div style={{ fontFamily: "Inter, sans-serif", minWidth: "200px" }}>
                  <p style={{ fontWeight: 700, color: "#fff", margin: "0 0 4px" }}>{inc.type}</p>
                  <p style={{ color: "#94a3b8", fontSize: "12px", margin: "2px 0" }}>📍 {inc.location} — {inc.ward}</p>
                  <p style={{ color: "#94a3b8", fontSize: "12px", margin: "2px 0" }}>
                    Severity:{" "}
                    <span style={{ color: inc.severity === "High" ? "#ef4444" : inc.severity === "Medium" ? "#fbbf24" : "#22d3ee", fontWeight: 600 }}>
                      {inc.severity}
                    </span>
                  </p>
                  {inc.confidence > 0 && (
                    <p style={{ color: "#94a3b8", fontSize: "12px", margin: "2px 0" }}>
                      AI Confidence: <span style={{ color: "#22d3ee", fontWeight: 600 }}>{Math.round(inc.confidence * 100)}%</span>
                    </p>
                  )}
                  {inc.dispatched_to && (
                    <div style={{ marginTop: "4px", padding: "4px 6px", background: "rgba(56,189,248,0.1)", border: "1px solid rgba(56,189,248,0.3)", borderRadius: "6px" }}>
                      <p style={{ color: "#38bdf8", fontSize: "11px", fontWeight: 600, margin: 0 }}>👷 Dispatched: {inc.dispatched_to}</p>
                      {inc.sla_deadline && <p style={{ color: "#94a3b8", fontSize: "10px", margin: 0 }}>⏳ SLA: {inc.sla_deadline}</p>}
                    </div>
                  )}
                  {inc.image_url && (
                    <div style={{ marginTop: "6px", maxHeight: "100px", overflow: "hidden", borderRadius: "6px", border: "1px solid #334155" }}>
                      <img src={resolveImageUrl(inc.image_url) || ""} alt="Evidence" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </div>
                  )}
                  <p style={{ color: "#64748b", fontSize: "11px", marginTop: "4px" }}>{inc.timestamp_label}</p>
                </div>
              </Popup>
            </Marker>
          ))}
          {/* Safe Route Polylines */}
          {activeRoute && (
            <>
              <Polyline
                positions={activeRoute.safest_route.waypoints}
                pathOptions={{
                  color: "#10b981",
                  weight: 6,
                  opacity: 0.9,
                  lineCap: "round",
                  lineJoin: "round",
                }}
              />
              <Polyline
                positions={activeRoute.fastest_route.waypoints}
                pathOptions={{
                  color: "#f43f5e",
                  weight: 4,
                  dashArray: "6, 8",
                  opacity: 0.65,
                }}
              />
            </>
          )}

          {/* BRTS Dedicated Bus Corridors & Enforcements */}
          {mapLayers.busLane && (
            <>
              {BRTS_CORRIDORS.map((corridor, idx) => (
                <Polyline
                  key={`brts-outer-${idx}`}
                  positions={corridor}
                  pathOptions={{
                    color: "#f472b6",
                    weight: 10,
                    opacity: 0.25,
                  }}
                />
              ))}
              {BRTS_CORRIDORS.map((corridor, idx) => (
                <Polyline
                  key={`brts-inner-${idx}`}
                  positions={corridor}
                  pathOptions={{
                    color: "#ec4899",
                    weight: 4,
                    dashArray: "6, 8",
                    opacity: 0.9,
                  }}
                />
              ))}
              {BRTS_CHECKPOINTS.map((cp) => (
                <Marker key={cp.id} position={cp.coords} icon={makeBRTSIcon(cp.name, cp.status)}>
                  <Popup>
                    <div style={{ minWidth: "190px", fontFamily: "Inter, sans-serif" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                        <span style={{ fontSize: "14px" }}>{cp.status === "warning" ? "⚠️" : "🚌"}</span>
                        <h4 style={{ color: "#f1f5f9", fontWeight: 700, fontSize: "12px", margin: 0 }}>{cp.name}</h4>
                      </div>
                      <div style={{ padding: "4px 8px", background: cp.status === "warning" ? "rgba(239,68,68,0.15)" : "rgba(16,185,129,0.15)", border: `1px solid ${cp.status === "warning" ? "rgba(239,68,68,0.4)" : "rgba(16,185,129,0.4)"}`, borderRadius: "6px", margin: "6px 0" }}>
                        <p style={{ color: cp.status === "warning" ? "#f87171" : "#34d399", fontSize: "11px", fontWeight: 600, margin: 0 }}>
                          {cp.compliance}
                        </p>
                        <p style={{ color: "#94a3b8", fontSize: "10px", margin: "2px 0 0 0" }}>{cp.desc}</p>
                      </div>
                      <p style={{ color: "#64748b", fontSize: "9px", margin: 0 }}>Enforced via CityEye Edge-YOLO Transit Feed</p>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </>
          )}
        </MapContainer>

        {/* Map Controls overlay */}
        <div className="absolute bottom-4 left-4 z-[1000] glass-lighter rounded-xl p-3 flex flex-col gap-2">
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">Map Layers</p>
          {[
            { key: "potholes" as const, label: "Show Incidents", color: "red" },
            { key: "fleet"    as const, label: "Track Fleet",    color: "cyan" },
            { key: "busLane"  as const, label: "BRTS Bus Lanes", color: "pink" },
            { key: "heatmap"  as const, label: "Heatmap",        color: "amber" },
          ].map(({ key, label, color }) => (
            <button
              key={key}
              onClick={() => onToggleLayer(key)}
              className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                mapLayers[key]
                  ? color === "red"   ? "bg-red-500/20 border-red-500/40 text-red-400"
                  : color === "cyan"  ? "bg-cyan-500/20 border-cyan-500/40 text-cyan-400"
                  : color === "pink"  ? "bg-pink-500/20 border-pink-500/40 text-pink-400"
                                      : "bg-amber-500/20 border-amber-500/40 text-amber-400"
                  : "bg-slate-800/40 border-slate-700/40 text-slate-400"
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${mapLayers[key] ? "bg-current" : "bg-slate-600"}`} />
              {label}
            </button>
          ))}
        </div>

        {/* Active Route Floating Banner */}
        {activeRoute && (
          <div className="absolute top-14 left-4 z-[1000] glass-lighter rounded-xl px-4 py-2 flex items-center gap-3 border border-emerald-500/40 fade-in-up">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                <span className="text-emerald-400">🛡️ Safe Route Active:</span>
                <span>{activeRoute.origin} ➔ {activeRoute.destination}</span>
              </div>
              <p className="text-[10px] text-emerald-300">
                {activeRoute.safest_route.smoothness_score}% Smoothness • Bypasses All Severe Hazards
              </p>
            </div>
            {onClearRoute && (
              <button
                onClick={onClearRoute}
                className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[10px] font-semibold text-slate-300 transition-colors"
              >
                Clear Route
              </button>
            )}
          </div>
        )}

        {/* Active incident info */}
        {activeIncident && (
          <div className="absolute top-4 right-4 z-[1000] glass-lighter rounded-xl px-3 py-2 fade-in-up">
            <p className="text-xs text-cyan-400 font-semibold">📍 Viewing: {activeIncident.type}</p>
            <p className="text-xs text-slate-400 mt-0.5">{activeIncident.lat.toFixed(4)}, {activeIncident.lng.toFixed(4)}</p>
          </div>
        )}

        {/* Stats bar */}
        <div className="absolute top-4 left-4 z-[1000] glass-lighter rounded-xl px-3 py-1.5 flex items-center gap-4">
          {[
            { label: "Total", val: incidents.length, color: "text-slate-300" },
            { label: "High", val: incidents.filter(i => i.severity === "High" && !i.resolved).length, color: "text-red-400" },
            { label: "Resolved", val: incidents.filter(i => i.resolved).length, color: "text-emerald-400" },
          ].map(s => (
            <div key={s.label} className="text-xs">
              <span className="text-slate-500">{s.label}: </span>
              <span className={`font-bold ${s.color}`}>{s.val}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
