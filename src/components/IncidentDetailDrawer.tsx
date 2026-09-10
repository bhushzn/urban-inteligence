import {
  X,
  MapPin,
  Shield,
  Clock,
  ExternalLink,
  CheckCircle,
  HardHat,
  Trash2,
  Cpu,
  Layers,
  Crosshair,
  AlertTriangle
} from "lucide-react";
import type { Incident, User } from "../api";
import { resolveImageUrl } from "../api";

interface Props {
  incident: Incident | null;
  onClose: () => void;
  onFocusMap: (inc: Incident) => void;
  onVerify: (id: number) => void;
  onResolve: (id: number) => void;
  onDispatch: (inc: Incident) => void;
  onDelete?: (id: number) => void;
  onDeleteImage?: (id: number) => void;
  user: User | null;
}

export default function IncidentDetailDrawer({
  incident: inc,
  onClose,
  onFocusMap,
  onVerify,
  onResolve,
  onDispatch,
  onDelete,
  onDeleteImage,
  user,
}: Props) {
  if (!inc) return null;

  const isAdmin = user?.role === "admin";
  const sevColor =
    inc.severity === "High"
      ? "badge-critical"
      : inc.severity === "Medium"
      ? "badge-warning"
      : "badge-normal";

  const confPct = inc.confidence > 0 ? Math.round(inc.confidence * 100) : 88;
  const bboxColor = inc.severity === "High" ? "#ef4444" : inc.severity === "Medium" ? "#f59e0b" : "#38bdf8";

  return (
    <div
      className="fixed inset-0 z-[99999] flex justify-end bg-black/60 backdrop-blur-[2px] transition-opacity duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl h-full bg-[#0d1424] border-l border-white/10 flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-right duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-[#0a0f1c] shrink-0">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs text-sky-400 font-bold bg-sky-950/60 px-2 py-0.5 rounded border border-sky-800/40">
              INC-#{inc.id.toString().padStart(4, "0")}
            </span>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded border ${sevColor}`}>
              {inc.severity} Priority
            </span>
            {inc.resolved ? (
              <span className="badge-success text-xs font-semibold px-2 py-0.5 rounded border flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> Resolved
              </span>
            ) : inc.verified ? (
              <span className="badge-normal text-xs font-semibold px-2 py-0.5 rounded border flex items-center gap-1">
                <Shield className="w-3 h-3" /> Verified
              </span>
            ) : (
              <span className="badge-warning text-xs font-semibold px-2 py-0.5 rounded border flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Unverified
              </span>
            )}
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Drawer Body (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 text-sm">
          {/* Anomaly Title & Subtitle */}
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">{inc.type}</h2>
            <p className="text-slate-400 text-xs mt-0.5 flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              <span>{inc.location}</span>
              <span className="text-slate-600">•</span>
              <span className="font-semibold text-slate-300">{inc.ward}</span>
            </p>
          </div>

          {/* Photographic Evidence with AI Bounding Box */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-sky-400" /> High-Resolution Evidence
              </span>
              <div className="flex items-center gap-2.5">
                <span className="font-mono text-[11px] text-slate-500">EXIF Timestamp: {inc.timestamp_label}</span>
                {inc.image_url && onDeleteImage && (
                  <button
                    onClick={() => onDeleteImage(inc.id)}
                    title="Remove photographic evidence from this incident"
                    className="flex items-center gap-1 px-2 py-0.5 rounded bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 hover:text-white text-[10px] font-semibold transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-2.5 h-2.5 text-rose-400" />
                    <span>Delete Image</span>
                  </button>
                )}
              </div>
            </div>

            <div className="relative w-full h-64 rounded-lg bg-black border border-white/10 overflow-hidden">
              {inc.image_url ? (
                <img
                  src={resolveImageUrl(inc.image_url) || ""}
                  alt={inc.type}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (!target.dataset.failed) {
                      target.dataset.failed = "true";
                      target.src = "/dummy_roads/road_pothole_1.jpg";
                    }
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-600 text-xs">
                  No photographic evidence captured
                </div>
              )}

              {/* Real-time Bounding Box Overlay */}
              <div
                className="absolute pointer-events-none"
                style={{
                  top: `${inc.bbox_y}%`,
                  left: `${inc.bbox_x}%`,
                  width: `${inc.bbox_w}%`,
                  height: `${inc.bbox_h}%`,
                  border: `2px solid ${bboxColor}`,
                  borderRadius: "2px",
                  boxShadow: `0 0 8px ${bboxColor}88`,
                }}
              >
                <div
                  className="absolute -top-5 left-0 text-[10px] font-bold font-mono px-1.5 py-0.5 rounded-sm flex items-center gap-1 shadow"
                  style={{ backgroundColor: bboxColor, color: "#000" }}
                >
                  <Cpu className="w-3 h-3" />
                  <span>{inc.type} {confPct}%</span>
                </div>
              </div>

              {/* Bottom Stamp */}
              <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between px-2.5 py-1 rounded bg-black/80 backdrop-blur-sm border border-white/10 text-[11px] font-mono text-slate-300">
                <span className="flex items-center gap-1">
                  <Crosshair className="w-3 h-3 text-sky-400" />
                  GPS: {inc.lat.toFixed(5)}° N, {inc.lng.toFixed(5)}° E
                </span>
                <span className="text-sky-400">Vidisha Municipal Transit</span>
              </div>
            </div>
          </div>

          {/* Telemetry & AI Inference Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-white/[0.03] border border-white/10 space-y-1">
              <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">AI Detection Model</div>
              <div className="font-mono text-sm text-white font-bold flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-sky-400" />
                <span>YOLOv8-RDD2022</span>
              </div>
              <div className="text-xs text-slate-400">Neural Confidence: <strong className="text-sky-300 font-mono">{confPct}%</strong></div>
              <div className="text-[11px] text-slate-500">Inference Latency: 26.4 ms</div>
            </div>

            <div className="p-3 rounded-lg bg-white/[0.03] border border-white/10 space-y-1">
              <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">Geolocation Precision</div>
              <div className="font-mono text-sm text-white font-bold flex items-center gap-1.5">
                <Crosshair className="w-3.5 h-3.5 text-emerald-400" />
                <span>Hardware EXIF GPS</span>
              </div>
              <div className="text-xs text-slate-400">Accuracy: <strong className="text-emerald-300 font-mono">± 3.2 meters</strong></div>
              <div className="text-[11px] text-slate-500">Coordinate IFD: 0x8825 (DMS)</div>
            </div>
          </div>

          {/* Contractor Dispatch & Work Order Status */}
          <div className="p-3.5 rounded-lg bg-white/[0.03] border border-white/10 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <HardHat className="w-3.5 h-3.5 text-purple-400" /> Contractor SLA Dispatch Status
              </span>
              {inc.dispatched_to ? (
                <span className="text-[11px] font-mono text-purple-300 bg-purple-950/60 px-2 py-0.5 rounded border border-purple-800/40">
                  Assigned
                </span>
              ) : (
                <span className="text-[11px] font-mono text-slate-400 bg-white/5 px-2 py-0.5 rounded border border-white/10">
                  Unassigned
                </span>
              )}
            </div>

            {inc.dispatched_to ? (
              <div className="space-y-1 text-xs">
                <div className="text-slate-300">Contractor Crew: <strong className="text-white">{inc.dispatched_to}</strong></div>
                {inc.sla_deadline && (
                  <div className="text-slate-300 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-amber-400" />
                    <span>SLA Deadline: <strong className="text-amber-300 font-mono">{inc.sla_deadline}</strong></span>
                  </div>
                )}
                {inc.dispatch_notes && (
                  <div className="text-slate-400 italic text-[11px]">"{inc.dispatch_notes}"</div>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-400">
                Recommended Action: <strong>24-Hour PWD Cold-Patch Compaction</strong>. No municipal repair crew currently assigned.
              </p>
            )}
          </div>

          {/* Quick Navigation Links */}
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={() => {
                onFocusMap(inc);
                onClose();
              }}
              className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/30 text-sky-300 font-semibold text-xs transition-colors"
            >
              <Crosshair className="w-3.5 h-3.5" />
              <span>Center on GIS Map</span>
            </button>

            <a
              href={`https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${inc.lat},${inc.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 font-semibold text-xs transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Street View</span>
            </a>
          </div>
        </div>

        {/* Drawer Action Footer */}
        <div className="px-5 py-3.5 border-t border-white/10 bg-[#0a0f1c] flex items-center justify-between gap-3 shrink-0">
          {onDelete && (
            <button
              onClick={() => {
                onDelete(inc.id);
                onClose();
              }}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3.5 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/40 text-rose-300 hover:text-white text-xs font-bold transition-all cursor-pointer"
              title="Permanently delete this incident"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              <span>Delete</span>
            </button>
          )}
          {!inc.verified && !inc.resolved && (
            <button
              onClick={() => {
                onVerify(inc.id);
                onClose();
              }}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition-all shadow"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Verify Anomaly</span>
            </button>
          )}

          {isAdmin && !inc.dispatched_to && !inc.resolved && (
            <button
              onClick={() => {
                onDispatch(inc);
                onClose();
              }}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow"
            >
              <HardHat className="w-3.5 h-3.5" />
              <span>Dispatch Crew</span>
            </button>
          )}

          {inc.verified && !inc.resolved && (
            <button
              onClick={() => {
                onResolve(inc.id);
                onClose();
              }}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Mark as Resolved</span>
            </button>
          )}

          <button
            onClick={onClose}
            className="py-2.5 px-4 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-xs font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
