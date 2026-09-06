import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Incident } from "../api";

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
        border:2px solid rgba(255,255,255,0.8);
        border-radius:50%;
        box-shadow:0 0 10px ${color},0 0 20px ${color}66;
        position:relative;
      ">
        <div style="
          position:absolute;inset:-6px;
          border-radius:50%;
          border:2px solid ${color}55;
          animation:ping 1.5s ease-out infinite;
        "></div>
      </div>
      <style>@keyframes ping{0%{transform:scale(1);opacity:.8}100%{transform:scale(2.5);opacity:0}}</style>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
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

interface Props {
  incidents: Incident[];
  activeIncident: Incident | null;
  onMarkerClick: (inc: Incident) => void;
  mapLayers: { heatmap: boolean; fleet: boolean; potholes: boolean };
  onToggleLayer: (layer: "heatmap" | "fleet" | "potholes") => void;
}

// Bhopal city centre
const BHOPAL_CENTER: [number, number] = [23.8388, 77.7753];

export default function MapView({ incidents, activeIncident, onMarkerClick, mapLayers, onToggleLayer }: Props) {
  const mapRef = useRef<L.Map | null>(null);

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
        <div className="flex items-center gap-1.5">
          {/* Legend */}
          {[
            { label: "High", color: "#ef4444" },
            { label: "Medium", color: "#fbbf24" },
            { label: "Low", color: "#22d3ee" },
          ].map((l) => (
            <div key={l.label} className="flex items-center gap-1 text-xs text-slate-400 ml-2">
              <div className="w-2 h-2 rounded-full" style={{ background: l.color }} />
              {l.label}
            </div>
          ))}
        </div>
      </div>

      {/* Map */}
      <div className="relative flex-1" style={{ minHeight: "400px" }}>
        <MapContainer
          center={BHOPAL_CENTER}
          zoom={13}
          style={{ height: "100%", width: "100%", background: "#0a0f1e" }}
          ref={mapRef as React.RefObject<L.Map>}
          zoomControl={true}
        >
          {/* Dark map tiles */}
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          />

          {/* Pan to active incident */}
          <PanTo incident={activeIncident} />

          {/* Incident markers */}
          {visibleIncidents.map((inc) => (
            <Marker
              key={inc.id}
              position={[inc.lat, inc.lng]}
              icon={ICONS[inc.severity] ?? ICONS.Low}
              eventHandlers={{ click: () => onMarkerClick(inc) }}
            >
              <Popup className="urban-popup">
                <div style={{ fontFamily: "Inter, sans-serif", minWidth: "180px" }}>
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
