import { useState, useMemo } from "react";
import { CheckCircle, MapPin, Shield, Loader2, CheckCheck, Volume2, VolumeX, Search, Filter } from "lucide-react";
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
}

type FilterType = "all" | "critical" | "unverified" | "resolved";

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
}: Props) {
  const [filter, setFilter] = useState<FilterType>("all");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    return incidents.filter((inc) => {
      // Filter tab
      if (filter === "critical" && (inc.severity !== "High" || inc.resolved)) return false;
      if (filter === "unverified" && (inc.verified || inc.resolved)) return false;
      if (filter === "resolved" && !inc.resolved) return false;

      // Search keyword
      if (search.trim()) {
        const q = search.toLowerCase();
        const match =
          inc.type.toLowerCase().includes(q) ||
          inc.ward.toLowerCase().includes(q) ||
          inc.location.toLowerCase().includes(q) ||
          inc.category.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [incidents, filter, search]);

  const isAdmin = user?.role === "admin";

  return (
    <div className="glass glow-cyan rounded-2xl flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-700/40 shrink-0 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${wsConnected ? "bg-red-500 blink" : "bg-slate-600"}`} />
            <span className="text-sm font-semibold text-slate-200 font-display">Live Incident Feed</span>
          </div>
          <div className="flex items-center gap-2">
            {/* Audio Toggle */}
            <button
              onClick={onToggleSound}
              title={soundEnabled ? "Audio alerts enabled (click to mute)" : "Audio alerts muted (click to enable)"}
              className={`p-1.5 rounded-lg border text-xs transition-colors ${
                soundEnabled
                  ? "bg-cyan-500/15 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/25"
                  : "bg-slate-800 border-slate-700 text-slate-500 hover:text-slate-400"
              }`}
            >
              {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            </button>
            <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/15 border border-red-500/30 text-red-400 font-medium">
              {incidents.filter(i => !i.resolved).length} Active
            </span>
            {wsConnected ? (
              <span className="text-xs text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 blink inline-block" />
                Live
              </span>
            ) : (
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" /> Connecting...
              </span>
            )}
          </div>
        </div>

        {/* Filter Tabs & Search */}
        <div className="flex items-center gap-1 bg-slate-900/60 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setFilter("all")}
            className={`flex-1 py-1 text-[11px] font-semibold rounded-lg transition-colors ${
              filter === "all" ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            All ({incidents.length})
          </button>
          <button
            onClick={() => setFilter("critical")}
            className={`flex-1 py-1 text-[11px] font-semibold rounded-lg transition-colors ${
              filter === "critical" ? "bg-red-500/20 text-red-300 border border-red-500/30" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            🚨 High
          </button>
          <button
            onClick={() => setFilter("unverified")}
            className={`flex-1 py-1 text-[11px] font-semibold rounded-lg transition-colors ${
              filter === "unverified" ? "bg-amber-500/20 text-amber-300 border border-amber-500/30" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            🛡️ Unverified
          </button>
          <button
            onClick={() => setFilter("resolved")}
            className={`flex-1 py-1 text-[11px] font-semibold rounded-lg transition-colors ${
              filter === "resolved" ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            ✅ Resolved
          </button>
        </div>

        {/* Search input */}
        <div className="relative">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by ward, location, or issue..."
            className="w-full pl-7 pr-3 py-1 text-xs rounded-lg bg-slate-900/80 border border-slate-700/60 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
          />
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2 top-2" />
        </div>
      </div>

      {/* Incident List */}
      <div className="overflow-y-auto flex-1 px-3 py-3 flex flex-col gap-2.5">
        {filtered.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-500 py-12">
            <Filter className="w-8 h-8 mb-2 text-slate-600 opacity-50" />
            <p className="text-sm font-medium">No matching incidents found</p>
            <p className="text-xs text-slate-600 mt-0.5">Try selecting "All" or clearing search</p>
          </div>
        ) : (
          filtered.map((inc, idx) => (
            <IncidentCard
              key={inc.id}
              incident={inc}
              isActive={activeId === inc.id}
              isAdmin={isAdmin}
              isLoggedIn={!!user}
              onSelect={() => onSelect(inc)}
              onVerify={() => onVerify(inc.id)}
              onResolve={() => onResolve(inc.id)}
              onOpenLogin={onOpenLogin}
              style={{ animationDelay: `${idx * 0.05}s` }}
            />
          ))
        )}
      </div>
    </div>
  );
}

function IncidentCard({
  incident: inc,
  isActive,
  isAdmin,
  isLoggedIn,
  onSelect,
  onVerify,
  onResolve,
  onOpenLogin,
  style,
}: {
  incident: Incident;
  isActive: boolean;
  isAdmin: boolean;
  isLoggedIn: boolean;
  onSelect: () => void;
  onVerify: () => void;
  onResolve: () => void;
  onOpenLogin: () => void;
  style?: React.CSSProperties;
}) {
  const sevColor = inc.severity === "High" ? "red" : inc.severity === "Medium" ? "amber" : "cyan";
  const sevStyle = {
    red:   { bg: "bg-red-500/15",     text: "text-red-400",     border: "border-red-500/40" },
    amber: { bg: "bg-amber-500/15",   text: "text-amber-400",   border: "border-amber-500/40" },
    cyan:  { bg: "bg-emerald-500/15", text: "text-emerald-400", border: "border-emerald-500/40" },
  }[sevColor];

  const bboxColor = sevColor === "red" ? "#ef4444" : sevColor === "amber" ? "#fbbf24" : "#22d3ee";
  const confPct = inc.confidence > 0 ? Math.round(inc.confidence * 100) : null;
  const typeIcon = 
    inc.category === "road"           ? "⚠️"
    : inc.category === "garbage"      ? "🗑️"
    : inc.category === "water"        ? "💧"
    : inc.category === "infrastructure" ? "💡"
    : inc.category === "animal"       ? "🐄"
    : "📋";

  return (
    <div
      onClick={onSelect}
      className={`glass-lighter rounded-xl p-3 cursor-pointer float-card fade-in-up transition-all duration-200 border ${
        inc.resolved
          ? "border-emerald-700/30 opacity-60"
          : isActive
          ? "incident-card-active"
          : "border-slate-700/30 hover:border-slate-600/50"
      }`}
      style={style}
    >
      <div className="flex gap-3">
        {/* Thumbnail */}
        <div
          className="relative w-20 h-16 rounded-lg shrink-0 overflow-hidden border border-slate-700/40"
          style={{ background: inc.image_url ? "transparent" : "#0a0f1e" }}
        >
          {inc.image_url ? (
            <img
              src={resolveImageUrl(inc.image_url) || ""}
              alt={inc.type}
              className="w-full h-full object-cover"
            />
          ) : (
            <>
              {/* Simulated thumbnail */}
              <div className="absolute inset-0 opacity-30"
                style={{ backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(255,255,255,0.03) 3px, rgba(255,255,255,0.03) 4px)" }}
              />
              <div className="absolute bottom-0 left-0 right-0 h-2/5"
                style={{ background: `linear-gradient(transparent, ${bboxColor}22)` }}
              />
            </>
          )}
          {/* AI Bounding Box */}
          <div
            className="absolute pointer-events-none"
            style={{
              top: `${inc.bbox_y}%`,
              left: `${inc.bbox_x}%`,
              width: `${inc.bbox_w}%`,
              height: `${inc.bbox_h}%`,
              border: `1.5px solid ${bboxColor}`,
              borderRadius: "3px",
              boxShadow: `0 0 6px ${bboxColor}60`,
            }}
          >
            <span className="absolute -top-3 left-0 text-[8px] font-bold px-1 py-0.5 rounded-sm"
              style={{ background: bboxColor, color: "#000", lineHeight: 1 }}>
              AI
            </span>
          </div>
          {confPct !== null && (
            <div className="absolute bottom-1 right-1 text-[7px] font-bold" style={{ color: bboxColor }}>
              {confPct}%
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-1 mb-1.5">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-sm">{typeIcon}</span>
              <p className="text-sm font-semibold text-white truncate leading-tight">{inc.type}</p>
            </div>
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md border shrink-0 ${sevStyle.bg} ${sevStyle.text} ${sevStyle.border}`}>
              {inc.severity}
            </span>
          </div>

          <div className="flex items-center gap-1 mb-1">
            <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
            <p className="text-xs text-slate-400 truncate">{inc.location}</p>
            <span className="text-slate-600 mx-0.5">•</span>
            <span className="text-xs text-slate-500 shrink-0">{inc.ward}</span>
          </div>

          <p className="text-xs text-slate-500 mb-2">
            📍 {inc.lat.toFixed(4)}, {inc.lng.toFixed(4)}
            <span className="ml-1 text-slate-600">• {inc.timestamp_label}</span>
          </p>

          <div className="flex items-center gap-1.5 flex-wrap">
            {inc.resolved ? (
              <div className="flex items-center gap-1 text-xs text-emerald-400">
                <CheckCheck className="w-3.5 h-3.5" /> Resolved
              </div>
            ) : inc.verified ? (
              <>
                <div className="flex items-center gap-1 text-xs text-emerald-400">
                  <CheckCircle className="w-3.5 h-3.5" /> Verified
                </div>
                <button
                  onClick={e => {
                    e.stopPropagation();
                    if (!isLoggedIn) {
                      onOpenLogin();
                      return;
                    }
                    if (!isAdmin) {
                      alert("⚠️ Permission Denied: Only Command Center Admins can resolve incidents.");
                      return;
                    }
                    onResolve();
                  }}
                  title={!isLoggedIn ? "Sign in to resolve" : !isAdmin ? "Requires Admin Role" : "Mark as Resolved"}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded-lg border text-xs font-semibold transition-all ${
                    isLoggedIn && !isAdmin
                      ? "bg-slate-800 border-slate-700 text-slate-500 cursor-not-allowed opacity-60"
                      : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20"
                  }`}
                >
                  Resolve
                </button>
              </>
            ) : (
              <button
                onClick={e => {
                  e.stopPropagation();
                  if (!isLoggedIn) {
                    onOpenLogin();
                    return;
                  }
                  if (!isAdmin) {
                    alert("⚠️ Permission Denied: Only Command Center Admins can verify incidents.");
                    return;
                  }
                  onVerify();
                }}
                title={!isLoggedIn ? "Sign in to verify" : !isAdmin ? "Requires Admin Role" : "Verify Anomaly"}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold transition-all ${
                  isLoggedIn && !isAdmin
                    ? "bg-slate-800 border-slate-700 text-slate-500 cursor-not-allowed opacity-60"
                    : "bg-cyan-500/10 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20"
                }`}
              >
                <Shield className="w-3 h-3" /> Verify
              </button>
            )}
            <a
              href={`https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${inc.lat},${inc.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-700/30 border border-slate-600/50 text-slate-300 text-[10px] font-semibold hover:bg-slate-700/60 transition-all ml-1"
            >
              🗺️ Street View
            </a>
            {isActive && !inc.resolved && (
              <span className="text-[10px] text-cyan-400 font-medium animate-pulse ml-auto">● Mapped</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
