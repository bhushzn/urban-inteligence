import { useState, useMemo } from "react";
import {
  CheckCircle,
  MapPin,
  Shield,
  Loader2,
  CheckCheck,
  Volume2,
  VolumeX,
  Search,
  Filter,
  HardHat,
  Cpu,
  Eye,
  Trash2
} from "lucide-react";
import type { Incident, User } from "../api";
import { resolveImageUrl } from "../api";

interface Props {
  incidents: Incident[];
  activeId: number | null;
  wsConnected: boolean;
  user: User | null;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onSelect: (inc: Incident) => void;
  onVerify: (id: number) => void;
  onResolve: (id: number) => void;
  onOpenLogin: () => void;
  onDispatch?: (inc: Incident) => void;
  onVerifyRepair?: (inc: Incident) => void;
  onInspect?: (inc: Incident) => void;
  onDelete?: (id: number) => void;
}

type FilterType = "all" | "critical" | "unverified" | "dispatched" | "resolved";

export default function IncidentFeed({
  incidents,
  activeId,
  wsConnected,
  user,
  soundEnabled,
  onToggleSound,
  onSelect,
  onVerify,
  onResolve,
  onOpenLogin,
  onDispatch,
  onVerifyRepair,
  onInspect,
  onDelete,
}: Props) {
  const [filter, setFilter] = useState<FilterType>("all");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    return incidents.filter((inc) => {
      // Exclude dummy incidents without genuine images
      if (!inc.image_url) return false;

      // Filter tabs
      if (filter === "critical" && (inc.severity !== "High" || inc.resolved)) return false;
      if (filter === "unverified" && (inc.verified || inc.resolved)) return false;
      if (filter === "dispatched" && (!inc.dispatched_to || inc.resolved)) return false;
      if (filter === "resolved" && !inc.resolved) return false;

      // Search keyword
      if (search.trim()) {
        const q = search.toLowerCase();
        const match =
          inc.type.toLowerCase().includes(q) ||
          inc.ward.toLowerCase().includes(q) ||
          inc.location.toLowerCase().includes(q) ||
          inc.category.toLowerCase().includes(q) ||
          (inc.dispatched_to && inc.dispatched_to.toLowerCase().includes(q));
        if (!match) return false;
      }
      return true;
    });
  }, [incidents, filter, search]);

  const activeCount = incidents.filter(i => !i.resolved && i.image_url).length;
  const criticalCount = incidents.filter(i => i.severity === "High" && !i.resolved && i.image_url).length;

  return (
    <div className="cmd-surface rounded-lg flex flex-col h-full overflow-hidden border border-white/10 shadow-sm">
      {/* Header & Status Bar */}
      <div className="px-3.5 py-2.5 border-b border-white/10 bg-[#0b101c] shrink-0 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              Live Incident Triage
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Audio Toggle */}
            <button
              onClick={onToggleSound}
              title={soundEnabled ? "Audio chime active" : "Audio chime muted"}
              className={`p-1 rounded text-xs transition-colors ${
                soundEnabled
                  ? "bg-sky-500/10 text-sky-400 border border-sky-500/20"
                  : "bg-white/5 text-slate-500 border border-white/5"
              }`}
            >
              {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            </button>

            {/* Active Counter Badge */}
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-white/5 border border-white/10 text-slate-300 font-semibold">
              <strong className="text-white">{activeCount}</strong> Active
            </span>

            {/* Connection Status */}
            {wsConnected ? (
              <span className="text-[10px] font-mono font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
                SYNC
              </span>
            ) : (
              <span className="text-[10px] font-mono text-slate-400 bg-white/5 px-1.5 py-0.5 rounded flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" /> CONNECTING
              </span>
            )}
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 bg-black/40 p-0.5 rounded border border-white/5 text-[11px] font-medium">
          <button
            onClick={() => setFilter("all")}
            className={`flex-1 py-1 rounded transition-colors ${
              filter === "all" ? "bg-white/15 text-white font-semibold" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            All ({incidents.filter(i => i.image_url).length})
          </button>
          <button
            onClick={() => setFilter("critical")}
            className={`flex-1 py-1 rounded transition-colors ${
              filter === "critical" ? "bg-red-500/20 text-red-300 border border-red-500/30 font-semibold" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Critical ({criticalCount})
          </button>
          <button
            onClick={() => setFilter("unverified")}
            className={`flex-1 py-1 rounded transition-colors ${
              filter === "unverified" ? "bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Unverified
          </button>
          <button
            onClick={() => setFilter("dispatched")}
            className={`flex-1 py-1 rounded transition-colors ${
              filter === "dispatched" ? "bg-purple-500/20 text-purple-300 border border-purple-500/30 font-semibold" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Dispatched
          </button>
          <button
            onClick={() => setFilter("resolved")}
            className={`flex-1 py-1 rounded transition-colors ${
              filter === "resolved" ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Resolved
          </button>
        </div>

        {/* Search Field */}
        <div className="relative">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search ward, street, anomaly type, or contractor..."
            className="w-full pl-7 pr-3 py-1 text-xs rounded bg-white/[0.04] border border-white/10 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-sky-500 font-mono"
          />
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2 top-2" />
        </div>
      </div>

      {/* Incident Cards Queue */}
      <div className="overflow-y-auto flex-1 p-2.5 space-y-2">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-slate-500 py-16 space-y-2">
            <Filter className="w-6 h-6 text-slate-600" />
            <p className="text-xs font-semibold text-slate-400">No matching incidents in current filter</p>
            <p className="text-[11px] text-slate-600">Select "All" or clear search keywords</p>
          </div>
        ) : (
          filtered.map((inc) => (
            <OperationalIncidentCard
              key={inc.id}
              incident={inc}
              isActive={activeId === inc.id}
              isAdmin={user?.role === "admin"}
              isLoggedIn={!!user}
              onSelect={() => onSelect(inc)}
              onVerify={() => onVerify(inc.id)}
              onResolve={() => onResolve(inc.id)}
              onDispatch={() => onDispatch?.(inc)}
              onVerifyRepair={onVerifyRepair ? () => onVerifyRepair(inc) : undefined}
              onInspect={() => onInspect?.(inc)}
              onDelete={() => onDelete?.(inc.id)}
              onOpenLogin={onOpenLogin}
            />
          ))
        )}
      </div>
    </div>
  );
}

function OperationalIncidentCard({
  incident: inc,
  isActive,
  isAdmin,
  isLoggedIn,
  onSelect,
  onVerify,
  onResolve,
  onDispatch,
  onVerifyRepair,
  onInspect,
  onDelete,
  onOpenLogin,
}: {
  incident: Incident;
  isActive: boolean;
  isAdmin: boolean;
  isLoggedIn: boolean;
  onSelect: () => void;
  onVerify: () => void;
  onResolve: () => void;
  onDispatch?: () => void;
  onVerifyRepair?: () => void;
  onInspect?: () => void;
  onDelete?: () => void;
  onOpenLogin: () => void;
}) {
  const isHigh = inc.severity === "High";
  const isMed = inc.severity === "Medium";

  const severityBorder = isHigh ? "border-l-red-500" : isMed ? "border-l-amber-500" : "border-l-sky-500";
  const badgeClass = isHigh ? "badge-critical" : isMed ? "badge-warning" : "badge-normal";
  const confPct = inc.confidence > 0 ? Math.round(inc.confidence * 100) : 88;

  // Recommended Municipal Action Formulation
  const recommendedAction =
    inc.category === "road"
      ? isHigh ? "24h PWD Cold-Patch Compaction" : "Routine Asphalt Smoothing"
      : inc.category === "water"
      ? "Emergency Storm Drain Pumpout"
      : inc.category === "garbage"
      ? "Waste Compactor Route Escalation"
      : inc.category === "bus_lane"
      ? "Automated Transit Tow Dispatch"
      : "Municipal Inspection Patrol";

  return (
    <div
      onClick={onSelect}
      className={`p-3 rounded bg-[#101728] border border-white/5 border-l-4 ${severityBorder} transition-all cursor-pointer ${
        isActive ? "ring-1 ring-sky-500 bg-[#142036]" : "hover:bg-[#131d32]"
      } ${inc.resolved ? "opacity-60" : ""}`}
    >
      <div className="flex gap-3">
        {/* Real Thumbnail Evidence */}
        <div className="relative w-20 h-16 rounded bg-black border border-white/10 shrink-0 overflow-hidden">
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
            <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-500">No Image</div>
          )}

          {/* AI Bounding Box Mini Overlay */}
          <div
            className="absolute pointer-events-none"
            style={{
              top: `${inc.bbox_y}%`,
              left: `${inc.bbox_x}%`,
              width: `${inc.bbox_w}%`,
              height: `${inc.bbox_h}%`,
              border: `1px solid ${isHigh ? "#ef4444" : isMed ? "#f59e0b" : "#38bdf8"}`,
            }}
          />

          <span className="absolute bottom-1 right-1 font-mono text-[8px] font-bold text-white bg-black/80 px-1 rounded">
            {confPct}%
          </span>
        </div>

        {/* Core Metadata */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-1 mb-1">
            <h4 className="text-xs font-bold text-white truncate leading-tight">
              {inc.type}
            </h4>
            <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded uppercase ${badgeClass} shrink-0`}>
              {inc.severity}
            </span>
          </div>

          <div className="text-[11px] text-slate-300 truncate flex items-center gap-1">
            <MapPin className="w-3 h-3 text-sky-400 shrink-0" />
            <span className="truncate">{inc.location}</span>
          </div>

          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono mt-1">
            <span className="text-slate-300 font-semibold">{inc.ward}</span>
            <span>•</span>
            <span>{inc.timestamp_label}</span>
            <span>•</span>
            <span className="text-sky-400 flex items-center gap-0.5">
              <Cpu className="w-2.5 h-2.5" /> AI {confPct}%
            </span>
          </div>
        </div>
      </div>

      {/* Recommended Action Ribbon */}
      <div className="mt-2 pt-1.5 border-t border-white/5 flex items-center justify-between text-[10px]">
        <div className="text-slate-400 truncate">
          <strong className="text-slate-300">Action:</strong> {recommendedAction}
        </div>
        {inc.dispatched_to && (
          <span className="font-mono text-purple-300 bg-purple-950/60 px-1.5 py-0.5 rounded border border-purple-800/40 shrink-0">
            👷 {inc.dispatched_to}
          </span>
        )}
      </div>

      {/* Operational Actions Toolbar */}
      <div className="mt-2 flex items-center gap-1.5 flex-wrap">
        {/* Inspect Details Button */}
        {onInspect && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onInspect();
            }}
            className="flex items-center gap-1 px-2 py-1 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-[11px] font-semibold transition-colors"
          >
            <Eye className="w-3 h-3 text-sky-400" />
            <span>Details</span>
          </button>
        )}

        {/* Verification Action */}
        {!inc.verified && !inc.resolved && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (!isLoggedIn) { onOpenLogin(); return; }
              onVerify();
            }}
            className="flex items-center gap-1 px-2 py-1 rounded bg-sky-600/80 hover:bg-sky-500 text-white text-[11px] font-semibold transition-colors"
          >
            <Shield className="w-3 h-3" />
            <span>Verify</span>
          </button>
        )}

        {/* Dispatch Action */}
        {isAdmin && !inc.dispatched_to && !inc.resolved && onDispatch && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDispatch();
            }}
            className="flex items-center gap-1 px-2 py-1 rounded bg-purple-600/80 hover:bg-purple-500 text-white text-[11px] font-semibold transition-colors"
          >
            <HardHat className="w-3 h-3" />
            <span>Dispatch SLA</span>
          </button>
        )}

        {/* Proof of Work */}
        {onVerifyRepair && inc.dispatched_to && !inc.resolved && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onVerifyRepair();
            }}
            className="flex items-center gap-1 px-2 py-1 rounded bg-emerald-600/80 hover:bg-emerald-500 text-white text-[11px] font-semibold transition-colors"
          >
            <span>Proof of Work</span>
          </button>
        )}

        {/* Resolve Action */}
        {inc.verified && !inc.resolved && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (!isLoggedIn) { onOpenLogin(); return; }
              onResolve();
            }}
            className="flex items-center gap-1 px-2 py-1 rounded bg-emerald-600/80 hover:bg-emerald-500 text-white text-[11px] font-semibold transition-colors ml-auto"
          >
            <CheckCircle className="w-3 h-3" />
            <span>Resolve</span>
          </button>
        )}

        {inc.resolved && (
          <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1 ml-auto">
            <CheckCheck className="w-3 h-3" /> RESOLVED
          </span>
        )}

        {/* Delete Action */}
        {onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            title="Permanently delete incident from database"
            className="flex items-center gap-1 px-2 py-1 rounded bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 hover:text-white text-[11px] font-semibold transition-colors ml-1 cursor-pointer"
          >
            <Trash2 className="w-3 h-3 text-rose-400" />
            <span className="hidden sm:inline">Delete</span>
          </button>
        )}
      </div>
    </div>
  );
}
