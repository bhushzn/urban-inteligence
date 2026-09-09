import { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Incident, SafeRouteResponse } from "../api";
import { resolveImageUrl } from "../api";
import {
  Crosshair,
  Bus,
  AlertTriangle,
  Flame,
  Shield,
  Navigation,
  Maximize2,
  Minimize2
} from "lucide-react";

// Fix Leaflet default icon issue with Vite
import iconUrl from "leaflet/dist/images/marker-icon.png";
import iconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
import shadowUrl from "leaflet/dist/images/marker-shadow.png";
L.Icon.Default.mergeOptions({ iconUrl, iconRetinaUrl, shadowUrl });

// High-contrast operational incident marker
function makeIcon(color: string, size = 16, categoryIcon = "⚠️") {
  return L.divIcon({
    className: "",
    html: `
      <div style="
        width:${size + 6}px;height:${size + 6}px;
        background:${color};
        border:2px solid #ffffff;
        border-radius:50%;
        display:flex;
        align-items:center;
        justify-content:center;
        box-shadow:0 2px 8px rgba(0,0,0,0.6);
        position:relative;
        cursor:pointer;
      ">
        <div style="
          position:absolute;inset:-4px;
          border-radius:50%;
          border:1.5px solid ${color};
          opacity:0.8;
          animation:ping-subtle 2s cubic-bezier(0,0,0.2,1) infinite;
        "></div>
        <span style="font-size:10px;line-height:1;filter:drop-shadow(0 1px 1px rgba(0,0,0,0.8));">${categoryIcon}</span>
      </div>
    `,
    iconSize: [size + 6, size + 6],
    iconAnchor: [(size + 6) / 2, (size + 6) / 2],
  });
}

function makeBusIcon(busNum: string, speed: number, _route?: string) {
  return L.divIcon({
    className: "",
    html: `
      <div style="
        display:inline-flex;
        align-items:center;
        gap:5px;
        background:#0a101f;
        border:1.5px solid #0284c7;
        padding:2px 7px;
        border-radius:4px;
        box-shadow:0 2px 8px rgba(0,0,0,0.7);
        color:#f8fafc;
        font-family:ui-monospace,SFMono-Regular,monospace;
        font-size:10px;
        font-weight:700;
        white-space:nowrap;
        transform:translate(-50%, -50%);
      ">
        <span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:#38bdf8;"></span>
        <span style="color:#38bdf8;">BUS ${busNum}</span>
        <span style="color:#94a3b8;font-weight:500;">${speed}km/h</span>
      </div>
    `,
    iconSize: [95, 22],
    iconAnchor: [47, 11],
  });
}

function makeBRTSIcon(label: string, status: "clear" | "warning") {
  const isWarn = status === "warning";
  const bg = isWarn ? "#ef4444" : "#10b981";
  return L.divIcon({
    className: "",
    html: `
      <div style="
        display:inline-flex;
        align-items:center;
        gap:4px;
        background:#0a0f1c;
        border:1px solid ${bg};
        border-radius:4px;
        padding:2px 6px;
        white-space:nowrap;
        transform:translate(-50%, -50%);
        box-shadow:0 2px 6px rgba(0,0,0,0.6);
      ">
        <span style="font-size:9px;">${isWarn ? "⚠️" : "🚌"}</span>
        <span style="color:#f8fafc;font-size:10px;font-weight:600;font-family:sans-serif;">${label}</span>
      </div>
    `,
    iconSize: [110, 22],
    iconAnchor: [55, 11],
  });
}

function getCategoryIcon(cat: string): string {
  switch (cat) {
    case "road": return "⚠️";
    case "bus_lane": return "🚌";
    case "garbage": return "🗑️";
    case "water": return "💧";
    case "infrastructure": return "💡";
    case "animal": return "🐄";
    default: return "📍";
  }
}

function PanTo({ incident }: { incident: Incident | null }) {
  const map = useMap();
  useEffect(() => {
    if (incident) {
      map.flyTo([incident.lat, incident.lng], 16, { duration: 1.2 });
    }
  }, [incident, map]);
  return null;
}

function MapController({ flyTarget }: { flyTarget: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (flyTarget) {
      map.flyTo(flyTarget, 15, { duration: 1.0 });
    }
  }, [flyTarget, map]);
  return null;
}

function RouteController({ activeRoute }: { activeRoute?: SafeRouteResponse | null }) {
  const map = useMap();
  useEffect(() => {
    if (activeRoute && activeRoute.safest_route && activeRoute.safest_route.waypoints.length > 0) {
      const allPoints = [
        ...activeRoute.safest_route.waypoints,
        ...activeRoute.fastest_route.waypoints,
      ];
      const bounds = L.latLngBounds(allPoints);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
    }
  }, [activeRoute, map]);
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
  onInspectIncident?: (inc: Incident) => void;
}

// Vidisha city centre (Madhav Ganj / Station Road / Neemtal)
const VIDISHA_CENTER: [number, number] = [23.5230, 77.8120];

// Dedicated Vidisha Transit Corridors - Snapped along actual Google Maps Road Networks
const BRTS_CORRIDORS: [number, number][][] = [
  // Corridor 1: Sanchi Highway (SH-19) ➔ Civil Lines ➔ Neemtal Lake Road ➔ Tilak Chowk ➔ Madhav Ganj ➔ Station Road
  [
    [23.5050, 77.7750],
    [23.5072, 77.7801],
    [23.5098, 77.7852],
    [23.5125, 77.7905],
    [23.5142, 77.7940],
    [23.5160, 77.7982],
    [23.5178, 77.8025],
    [23.5190, 77.8064],
    [23.5205, 77.8080],
    [23.5222, 77.8098],
    [23.5240, 77.8115],
    [23.5238, 77.8130],
    [23.5230, 77.8140],
    [23.5226, 77.8148],
    [23.5220, 77.8162],
  ],
  // Corridor 2: Ahmedpur Road ➔ Collectorate ➔ Madhav Ganj ➔ Station Rd ➔ Durga Nagar ➔ Betwa Ghats
  [
    [23.5350, 77.8100],
    [23.5320, 77.8103],
    [23.5290, 77.8108],
    [23.5265, 77.8112],
    [23.5240, 77.8115],
    [23.5226, 77.8148],
    [23.5202, 77.8155],
    [23.5185, 77.8162],
    [23.5170, 77.8171],
    [23.5188, 77.8202],
    [23.5215, 77.8228],
    [23.5245, 77.8250],
  ],
  // Corridor 3: Neemtal Lake Loop ➔ South Ring Road ➔ Durga Nagar Link
  [
    [23.5190, 77.8064],
    [23.5175, 77.8100],
    [23.5170, 77.8140],
    [23.5170, 77.8171],
    [23.5202, 77.8155],
    [23.5226, 77.8148],
  ]
];

interface BRTSCheckpoint {
  id: string;
  name: string;
  coords: [number, number];
  status: "clear" | "warning";
  compliance: string;
  desc: string;
}

const BRTS_CHECKPOINTS: BRTSCheckpoint[] = [
  {
    id: "brts-1",
    name: "Madhav Ganj Hub",
    coords: [23.5240, 77.8115],
    status: "clear",
    compliance: "98% Clear",
    desc: "Active AI Camera Unit VD-101 scanning lane",
  },
  {
    id: "brts-3",
    name: "Station Road Lane",
    coords: [23.5226, 77.8148],
    status: "clear",
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
  { id: "b2", number: "202", route: "Station Rd ➔ District Hospital", lat: 23.5226, lng: 77.8148, speed: 28, deltaLat: -0.0004, deltaLng: -0.0003 },
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
  onInspectIncident,
}: Props) {
  const mapRef = useRef<L.Map | null>(null);
  const [mapStyle, setMapStyle] = useState<"google-streets" | "google-hybrid" | "dark">("google-streets");
  const [buses, setBuses] = useState<BusVehicle[]>(INITIAL_BUSES);
  const [flyTarget, setFlyTarget] = useState<[number, number] | null>(null);
  const [isFullView, setIsFullView] = useState<boolean>(false);

  // Keyboard shortcut: Escape to exit full view map
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isFullView) {
        setIsFullView(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFullView]);

  // Force Leaflet map resize calculation when toggling full view
  useEffect(() => {
    const t1 = setTimeout(() => {
      if (mapRef.current) mapRef.current.invalidateSize();
    }, 100);
    const t2 = setTimeout(() => {
      if (mapRef.current) mapRef.current.invalidateSize();
    }, 350);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [isFullView]);

  // Animate transit bus fleet positions along corridors
  useEffect(() => {
    if (!mapLayers.fleet) return;
    const interval = setInterval(() => {
      setBuses(prev => prev.map(bus => {
        let newLat = bus.lat + bus.deltaLat;
        let newLng = bus.lng + bus.deltaLng;
        let deltaLat = bus.deltaLat;
        let deltaLng = bus.deltaLng;

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
    if (!inc.image_url) return false;
    return true;
  });

  return (
    <div
      className={
        isFullView
          ? "fixed inset-0 z-[99990] w-screen h-screen bg-[#080c14] flex flex-col rounded-none border-0 shadow-2xl"
          : "cmd-surface rounded-lg overflow-hidden flex flex-col h-full min-h-[400px] lg:min-h-[480px] border border-white/10 shadow-sm relative"
      }
    >
      {/* Top GIS Operations Toolbar */}
      <div className="bg-[#0b101c] border-b border-white/10 px-3.5 py-2 flex flex-wrap items-center justify-between gap-2.5 z-10">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-sky-400" />
          <span className="font-semibold text-xs text-white uppercase tracking-wider">
            GIS Command Map
          </span>
          {isFullView && (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30">
              FULL VIEW MODE (Press Esc to exit)
            </span>
          )}
          <span className="text-[11px] text-slate-400 font-mono hidden 2xl:inline">
            • Vidisha, MP [23.5230° N, 77.8120° E]
          </span>
          <span className="text-[11px] text-slate-400 font-mono hidden sm:inline 2xl:hidden">
            • Vidisha, MP
          </span>
        </div>

        {/* Quick Vidisha Landmarks Focus - Top 3 on Compact Laptops, All 5 on Large Screens */}
        <div className="hidden md:flex items-center gap-1 bg-white/[0.03] border border-white/5 px-2 py-0.5 rounded text-[11px]">
          <span className="text-slate-500 font-semibold mr-1 uppercase text-[10px]">Jump To:</span>
          {[
            { name: "Madhav Ganj", coords: [23.5240, 77.8115] as [number, number], priority: true },
            { name: "Station Rd", coords: [23.5226, 77.8148] as [number, number], priority: true },
            { name: "District Hospital", coords: [23.5280, 77.8105] as [number, number], priority: true },
            { name: "Durga Nagar", coords: [23.5170, 77.8171] as [number, number], priority: false },
            { name: "Sanchi Rd", coords: [23.5050, 77.7750] as [number, number], priority: false },
          ].map(w => (
            <button
              key={w.name}
              onClick={() => setFlyTarget(w.coords)}
              className={`px-1.5 py-0.5 rounded text-slate-400 hover:text-sky-300 hover:bg-white/5 transition-colors font-medium ${
                w.priority ? "inline-block" : "hidden xl:inline-block"
              }`}
            >
              {w.name}
            </button>
          ))}
        </div>

        {/* Map Tile Mode Selector & Full View Map Toggle */}
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-1 bg-black/40 p-0.5 rounded border border-white/10 text-[11px]">
            <button
              onClick={() => setMapStyle("google-streets")}
              title="Google Maps Streets"
              className={`px-2 py-0.5 rounded font-medium transition-colors ${
                mapStyle === "google-streets" ? "bg-sky-600 text-white font-semibold" : "text-slate-400 hover:text-white"
              }`}
            >
              Roadmap
            </button>
            <button
              onClick={() => setMapStyle("google-hybrid")}
              title="Google Maps Satellite Hybrid"
              className={`px-2 py-0.5 rounded font-medium transition-colors ${
                mapStyle === "google-hybrid" ? "bg-sky-600 text-white font-semibold" : "text-slate-400 hover:text-white"
              }`}
            >
              Satellite
            </button>
            <button
              onClick={() => setMapStyle("dark")}
              title="Dark Tactical Canvas"
              className={`px-2 py-0.5 rounded font-medium transition-colors ${
                mapStyle === "dark" ? "bg-sky-600 text-white font-semibold" : "text-slate-400 hover:text-white"
              }`}
            >
              Dark
            </button>
          </div>

          {/* Full View Map Button */}
          <button
            onClick={() => setIsFullView(!isFullView)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-all border shadow-sm cursor-pointer ${
              isFullView
                ? "bg-rose-600 hover:bg-rose-500 text-white border-rose-500 shadow-rose-950/40"
                : "bg-sky-600 hover:bg-sky-500 text-white border-sky-500 shadow-sky-950/40"
            }`}
            title={isFullView ? "Exit Full View Map (Esc)" : "Open GIS Map in Full View to explore clearly"}
          >
            {isFullView ? (
              <>
                <Minimize2 className="w-3.5 h-3.5" />
                <span>Exit Full View</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-3.5 h-3.5" />
                <span>Full View Map</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Map Canvas */}
      <div className="relative flex-1 w-full h-full min-h-[360px] lg:min-h-[420px]">
        <MapContainer
          center={VIDISHA_CENTER}
          zoom={14}
          style={{ height: "100%", width: "100%", background: mapStyle.startsWith("google") ? "#e5e3df" : "#080c14" }}
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
            attribution={mapStyle.startsWith("google") ? '&copy; Google Maps' : '&copy; OpenStreetMap'}
          />

          {/* Programmatic Navigation */}
          <PanTo incident={activeIncident} />
          <MapController flyTarget={flyTarget} />
          <RouteController activeRoute={activeRoute} />

          {/* Dynamic Risk Density Heatmap Layer */}
          {mapLayers.heatmap && visibleIncidents.map((inc) => {
            if (inc.resolved) return null;
            const isHigh = inc.severity === "High";
            return (
              <Circle
                key={`heat-${inc.id}`}
                center={[inc.lat, inc.lng]}
                radius={isHigh ? 420 : 280}
                pathOptions={{
                  color: isHigh ? "#ef4444" : "#f59e0b",
                  fillColor: isHigh ? "#ef4444" : "#f59e0b",
                  fillOpacity: isHigh ? 0.28 : 0.18,
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
              icon={makeBusIcon(bus.number, bus.speed, bus.route)}
            >
              <Popup className="cmd-popup">
                <div style={{ fontFamily: "Inter, sans-serif", minWidth: "190px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
                    <span style={{ fontWeight: 700, color: "#38bdf8", fontSize: "12px", fontFamily: "monospace" }}>BUS #{bus.number}</span>
                    <span style={{ background: "rgba(16,185,129,0.15)", color: "#34d399", border: "1px solid rgba(16,185,129,0.3)", borderRadius: "3px", padding: "1px 4px", fontSize: "9px", fontWeight: 700 }}>
                      TELEMETRY SYNC
                    </span>
                  </div>
                  <p style={{ color: "#f1f5f9", fontSize: "11px", margin: "2px 0", fontWeight: 600 }}>{bus.route}</p>
                  <p style={{ color: "#94a3b8", fontSize: "11px", margin: "2px 0", fontFamily: "monospace" }}>Speed: {bus.speed} km/h • GPS Active</p>
                  <p style={{ color: "#64748b", fontSize: "10px", marginTop: "4px" }}>Vidisha Municipal Transit Unit</p>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Incident markers */}
          {visibleIncidents.map((inc) => {
            const color = inc.severity === "High" ? "#ef4444" : inc.severity === "Medium" ? "#f59e0b" : "#38bdf8";
            const iconSymbol = getCategoryIcon(inc.category);
            return (
              <Marker
                key={inc.id}
                position={[inc.lat, inc.lng]}
                icon={makeIcon(color, 16, iconSymbol)}
                eventHandlers={{ click: () => onMarkerClick(inc) }}
              >
                <Popup className="cmd-popup">
                  <div style={{ fontFamily: "Inter, sans-serif", minWidth: "210px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
                      <span style={{ fontWeight: 700, color: "#fff", fontSize: "12px" }}>{inc.type}</span>
                      <span style={{
                        fontSize: "10px",
                        fontWeight: 700,
                        padding: "1px 5px",
                        borderRadius: "3px",
                        background: inc.severity === "High" ? "rgba(239,68,68,0.2)" : inc.severity === "Medium" ? "rgba(245,158,11,0.2)" : "rgba(14,165,233,0.2)",
                        color: inc.severity === "High" ? "#f87171" : inc.severity === "Medium" ? "#fbbf24" : "#38bdf8"
                      }}>
                        {inc.severity}
                      </span>
                    </div>

                    <p style={{ color: "#94a3b8", fontSize: "11px", margin: "2px 0" }}>📍 {inc.location} ({inc.ward})</p>
                    <p style={{ color: "#64748b", fontSize: "10px", margin: "2px 0", fontFamily: "monospace" }}>
                      {inc.lat.toFixed(4)}° N, {inc.lng.toFixed(4)}° E • {inc.timestamp_label}
                    </p>

                    {inc.image_url && (
                      <div style={{ marginTop: "6px", height: "90px", overflow: "hidden", borderRadius: "4px", border: "1px solid rgba(255,255,255,0.1)" }}>
                        <img src={resolveImageUrl(inc.image_url) || ""} alt="Evidence" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      </div>
                    )}

                    {onInspectIncident && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onInspectIncident(inc);
                        }}
                        style={{
                          width: "100%",
                          marginTop: "8px",
                          padding: "4px 8px",
                          background: "#0284c7",
                          color: "#fff",
                          border: "none",
                          borderRadius: "4px",
                          fontSize: "11px",
                          fontWeight: 600,
                          cursor: "pointer"
                        }}
                      >
                        Inspect Anomaly Details
                      </button>
                    )}
                  </div>
                </Popup>
              </Marker>
            );
          })}

          {/* Safe Route Polylines */}
          {activeRoute && (
            <>
              <Polyline
                positions={activeRoute.safest_route.waypoints}
                pathOptions={{
                  color: "#10b981",
                  weight: 5,
                  opacity: 0.9,
                  lineCap: "round",
                  lineJoin: "round",
                }}
              />
              <Polyline
                positions={activeRoute.fastest_route.waypoints}
                pathOptions={{
                  color: "#f43f5e",
                  weight: 3.5,
                  dashArray: "6, 8",
                  opacity: 0.7,
                }}
              />
            </>
          )}

          {/* BRTS Dedicated Bus Corridors */}
          {mapLayers.busLane && (
            <>
              {BRTS_CORRIDORS.map((corridor, idx) => (
                <Polyline
                  key={`brts-outer-${idx}`}
                  positions={corridor}
                  pathOptions={{
                    color: "#0284c7",
                    weight: 8,
                    opacity: 0.2,
                  }}
                />
              ))}
              {BRTS_CORRIDORS.map((corridor, idx) => (
                <Polyline
                  key={`brts-inner-${idx}`}
                  positions={corridor}
                  pathOptions={{
                    color: "#38bdf8",
                    weight: 3,
                    dashArray: "6, 8",
                    opacity: 0.85,
                  }}
                />
              ))}
              {BRTS_CHECKPOINTS.map((cp) => (
                <Marker key={cp.id} position={cp.coords} icon={makeBRTSIcon(cp.name, cp.status)}>
                  <Popup>
                    <div style={{ minWidth: "180px", fontFamily: "Inter, sans-serif" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                        <span style={{ fontSize: "13px" }}>{cp.status === "warning" ? "⚠️" : "🚌"}</span>
                        <h4 style={{ color: "#f1f5f9", fontWeight: 700, fontSize: "12px", margin: 0 }}>{cp.name}</h4>
                      </div>
                      <p style={{ color: cp.status === "warning" ? "#f87171" : "#34d399", fontSize: "11px", fontWeight: 600, margin: "2px 0" }}>
                        {cp.compliance}
                      </p>
                      <p style={{ color: "#94a3b8", fontSize: "10px", margin: "2px 0" }}>{cp.desc}</p>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </>
          )}
        </MapContainer>

        {/* Top-Left Floating Tactical Telemetry Card */}
        <div className="absolute top-3 left-3 z-[1000] bg-[#090e1c]/90 backdrop-blur-sm border border-white/10 rounded px-3 py-2 text-xs flex items-center gap-3.5 shadow-md">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 text-[11px] uppercase font-semibold">Plotted:</span>
            <span className="font-mono font-bold text-white">{visibleIncidents.length}</span>
          </div>
          <span className="text-white/10">|</span>
          <div className="flex items-center gap-1.5">
            <span className="text-red-400 text-[11px] uppercase font-semibold">Critical:</span>
            <span className="font-mono font-bold text-red-400">
              {visibleIncidents.filter(i => i.severity === "High" && !i.resolved).length}
            </span>
          </div>
          <span className="text-white/10">|</span>
          <div className="flex items-center gap-1.5">
            <span className="text-emerald-400 text-[11px] uppercase font-semibold">Resolved:</span>
            <span className="font-mono font-bold text-emerald-400">
              {visibleIncidents.filter(i => i.resolved).length}
            </span>
          </div>
        </div>

        {/* Bottom-Left Layer Toggles Toolbar */}
        <div className="absolute bottom-3 left-3 z-[1000] bg-[#090e1c]/90 backdrop-blur-sm border border-white/10 rounded p-1.5 flex items-center gap-1 shadow-md">
          {[
            { key: "potholes" as const, label: "Incidents", icon: <AlertTriangle className="w-3 h-3 text-red-400" /> },
            { key: "fleet" as const, label: "Fleet", icon: <Bus className="w-3 h-3 text-sky-400" /> },
            { key: "busLane" as const, label: "Transit Road Paths", icon: <Shield className="w-3 h-3 text-cyan-400" /> },
            { key: "heatmap" as const, label: "Heatmap", icon: <Flame className="w-3 h-3 text-amber-400" /> },
          ].map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => onToggleLayer(key)}
              className={`flex items-center gap-1.5 px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                mapLayers[key]
                  ? "bg-white/10 text-white border border-white/15"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent"
              }`}
            >
              {icon}
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* Safe Route Notification Overlay */}
        {activeRoute && (
          <div className="absolute top-12 left-3 z-[1000] bg-[#090e1c]/95 border border-emerald-500/40 rounded px-3 py-2 flex items-center gap-3 shadow-lg">
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <Navigation className="w-3.5 h-3.5 text-emerald-400" />
                <span>Safe Corridor Active: {activeRoute.origin} ➔ {activeRoute.destination}</span>
              </div>
              <p className="text-[11px] text-emerald-300 font-mono">
                {activeRoute.safest_route.smoothness_score}% Pavement Smoothness • 0 Critical Hazards Encountered
              </p>
            </div>
            {onClearRoute && (
              <button
                onClick={onClearRoute}
                className="px-2 py-1 rounded bg-white/10 hover:bg-white/15 text-slate-300 text-[10px] font-semibold"
              >
                Dismiss
              </button>
            )}
          </div>
        )}

        {/* Bottom-Right Coordinates HUD - Responsive */}
        <div className="hidden sm:flex absolute bottom-3 right-3 z-[1000] bg-[#090e1c]/90 backdrop-blur-sm border border-white/10 rounded px-2.5 py-1 text-[10px] font-mono text-slate-400 shadow-md items-center gap-1.5">
          <Crosshair className="w-3 h-3 text-sky-400 shrink-0" />
          <span className="hidden xl:inline">VIDISHA GRID • </span>
          <span>23.5230° N, 77.8120° E</span>
          <span className="hidden 2xl:inline"> • WGS84</span>
        </div>
      </div>
    </div>
  );
}
