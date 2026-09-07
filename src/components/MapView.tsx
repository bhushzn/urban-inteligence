import { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Incident } from "../api";
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
        display:flex;align-items:center;gap:4px;
        background:rgba(15, 23, 42, 0.92);
        border:1.5px solid #38bdf8;
        padding:2px 6px;
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
  mapLayers: { heatmap: boolean; fleet: boolean; potholes: boolean };
  onToggleLayer: (layer: "heatmap" | "fleet" | "potholes") => void;
}

// Bhopal city centre
const BHOPAL_CENTER: [number, number] = [23.8388, 77.7753];

// Simulated Transit Bus Fleet with live routes
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
  { id: "b1", number: "102", route: "Kolar Rd ➔ New Market", lat: 23.8310, lng: 77.7850, speed: 36, deltaLat: 0.0006, deltaLng: 0.0004 },
  { id: "b2", number: "204", route: "Ayodhya Bypass ➔ MP Nagar", lat: 23.8430, lng: 77.7680, speed: 41, deltaLat: -0.0005, deltaLng: 0.0007 },
  { id: "b3", number: "315", route: "Arera Colony ➔ TT Nagar", lat: 23.8490, lng: 77.7880, speed: 31, deltaLat: 0.0004, deltaLng: -0.0005 },
  { id: "b4", number: "412", route: "Habibganj ➔ Shivaji Nagar", lat: 23.8180, lng: 77.7760, speed: 38, deltaLat: -0.0004, deltaLng: -0.0006 },
];

export default function MapView({ incidents, activeIncident, onMarkerClick, mapLayers, onToggleLayer }: Props) {
  const mapRef = useRef<L.Map | null>(null);
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

        // Bounce back if moved too far from Bhopal center
        if (Math.abs(newLat - BHOPAL_CENTER[0]) > 0.035) deltaLat = -deltaLat;
        if (Math.abs(newLng - BHOPAL_CENTER[1]) > 0.035) deltaLng = -deltaLng;

        const jitterSpeed = Math.max(22, Math.min(52, bus.speed + Math.floor(Math.random() * 5 - 2)));
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
    return true;
  });

  return (
    <div className="glass glow-cyan rounded-2xl overflow-hidden relative flex flex-col" style={{ minHeight: "480px" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/40 z-10 relative bg-slate-900/60">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-cyan-400 blink" />
          <span className="text-sm font-semibold text-slate-200 font-display">GIS Command Map</span>
          <span className="text-xs text-slate-500 ml-1">— Bhopal, Madhya Pradesh • LIVE</span>
        </div>
        <div className="flex items-center gap-2">
          {/* Quick Ward Focus */}
          <div className="hidden sm:flex items-center gap-1 bg-slate-800/40 border border-slate-700/40 px-2 py-1 rounded-lg text-[11px]">
            <span className="text-slate-500 font-semibold mr-1">Focus:</span>
            {[
              { name: "Ward 7", coords: [23.8300, 77.7900] as [number, number] },
              { name: "Ward 12", coords: [23.8412, 77.7654] as [number, number] },
              { name: "Arera", coords: [23.8522, 77.7820] as [number, number] },
              { name: "MP Nagar", coords: [23.8270, 77.7600] as [number, number] },
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
          center={BHOPAL_CENTER}
          zoom={13}
          style={{ height: "100%", width: "100%", background: "#0a0f1e" }}
          ref={mapRef as React.RefObject<L.Map>}
          zoomControl={true}
        >
          {/* Dark Carto Tiles */}
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
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
        </MapContainer>

        {/* Map Controls overlay */}
        <div className="absolute bottom-4 left-4 z-[1000] glass-lighter rounded-xl p-3 flex flex-col gap-2">
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">Map Layers</p>
          {[
            { key: "potholes" as const, label: "Show Incidents", color: "red" },
            { key: "fleet"    as const, label: "Track Fleet",    color: "cyan" },
            { key: "heatmap"  as const, label: "Heatmap",        color: "amber" },
          ].map(({ key, label, color }) => (
            <button
              key={key}
              onClick={() => onToggleLayer(key)}
              className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                mapLayers[key]
                  ? color === "red"   ? "bg-red-500/20 border-red-500/40 text-red-400"
                  : color === "cyan"  ? "bg-cyan-500/20 border-cyan-500/40 text-cyan-400"
                                      : "bg-amber-500/20 border-amber-500/40 text-amber-400"
                  : "bg-slate-800/40 border-slate-700/40 text-slate-400"
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${mapLayers[key] ? "bg-current" : "bg-slate-600"}`} />
              {label}
            </button>
          ))}
        </div>

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
