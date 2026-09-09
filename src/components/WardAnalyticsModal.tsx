import React, { useState, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  X,
  BarChart3,
  CheckCircle2,
  PieChart,
  Clock,
  Download,
  RefreshCw,
  TrendingUp,
  MapPin,
  ShieldAlert,
  Layers,
  Sparkles,
} from "lucide-react";
import type { Analytics } from "../api";

interface WardAnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  analytics: Analytics | null;
  onRefresh?: () => void;
}

// Category visual mapping
const CATEGORY_META: Record<
  string,
  { label: string; icon: string; color: string; gradient: string }
> = {
  road: {
    label: "Road Fracture / Distress",
    icon: "🛣️",
    color: "#f87171",
    gradient: "from-red-500 to-rose-600",
  },
  water: {
    label: "Waterlogging / Drainage",
    icon: "🌊",
    color: "#38bdf8",
    gradient: "from-sky-500 to-blue-600",
  },
  pothole: {
    label: "Severe Pothole",
    icon: "🕳️",
    color: "#fb923c",
    gradient: "from-orange-500 to-amber-600",
  },
  garbage: {
    label: "Garbage Overflow",
    icon: "🗑️",
    color: "#facc15",
    gradient: "from-yellow-400 to-amber-500",
  },
  encroachment: {
    label: "Encroachment & Obstruction",
    icon: "🚫",
    color: "#c084fc",
    gradient: "from-purple-500 to-violet-600",
  },
  bus_lane: {
    label: "Transit Lane Violation",
    icon: "🚌",
    color: "#f472b6",
    gradient: "from-pink-500 to-rose-500",
  },
  infrastructure: {
    label: "Civic Infrastructure",
    icon: "💡",
    color: "#2dd4bf",
    gradient: "from-teal-400 to-emerald-500",
  },
  animal: {
    label: "Stray Animal Hazard",
    icon: "🐕",
    color: "#34d399",
    gradient: "from-emerald-400 to-teal-500",
  },
  other: {
    label: "Uncategorized Civic Hazard",
    icon: "⚠️",
    color: "#94a3b8",
    gradient: "from-slate-400 to-slate-600",
  },
};

export const WardAnalyticsModal: React.FC<WardAnalyticsModalProps> = ({
  isOpen,
  onClose,
  analytics,
  onRefresh,
}) => {
  const [wardSort, setWardSort] = useState<"count" | "name">("name");
  const [activeTab, setActiveTab] = useState<"all" | "wards" | "sla" | "yolo">("all");
  const [hoveredWard, setHoveredWard] = useState<string | null>(null);
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const totalAnomalies = analytics?.total ?? 0;
  const safeTotal = totalAnomalies > 0 ? totalAnomalies : 1;

  // Process and sort ward breakdown
  const sortedWards = useMemo(() => {
    if (!analytics?.ward_breakdown) return [];
    const list = [...analytics.ward_breakdown];
    if (wardSort === "count") {
      return list.sort((a, b) => b.count - a.count);
    }
    // Sort naturally by ward numbers (e.g. Ward 1, Ward 2, Ward 10)
    return list.sort((a, b) => {
      const numA = parseInt(a.ward.replace(/\D/g, ""), 10) || 0;
      const numB = parseInt(b.ward.replace(/\D/g, ""), 10) || 0;
      return numA - numB;
    });
  }, [analytics?.ward_breakdown, wardSort]);

  const maxWardCount = useMemo(() => {
    if (!sortedWards.length) return 1;
    return Math.max(...sortedWards.map((w) => w.count), 1);
  }, [sortedWards]);

  // Process Category Breakdown
  const processedCategories = useMemo(() => {
    if (!analytics?.category_breakdown) return [];
    return analytics.category_breakdown.map((item) => {
      const meta = CATEGORY_META[item.category] || {
        label: item.category.charAt(0).toUpperCase() + item.category.slice(1),
        icon: "📍",
        color: "#94a3b8",
        gradient: "from-slate-400 to-slate-600",
      };
      const pct = Math.round((item.count / safeTotal) * 100);
      return {
        ...item,
        meta,
        percentage: pct,
      };
    });
  }, [analytics?.category_breakdown, safeTotal]);

  // Calculate SVG Donut chart slices for category distribution
  const donutSlices = useMemo(() => {
    if (!processedCategories.length) return [];
    let currentAngle = 0;
    return processedCategories.map((cat) => {
      const sliceAngle = (cat.count / safeTotal) * 360;
      const startAngle = currentAngle;
      const endAngle = currentAngle + sliceAngle;
      currentAngle = endAngle;

      const radius = 60;
      const cx = 80;
      const cy = 80;

      // Arc coordinates
      const startRad = ((startAngle - 90) * Math.PI) / 180;
      const endRad = ((endAngle - 90) * Math.PI) / 180;

      const x1 = cx + radius * Math.cos(startRad);
      const y1 = cy + radius * Math.sin(startRad);
      const x2 = cx + radius * Math.cos(endRad);
      const y2 = cy + radius * Math.sin(endRad);

      const largeArcFlag = sliceAngle > 180 ? 1 : 0;
      const d =
        sliceAngle >= 359.9
          ? `M ${cx} ${cy - radius} A ${radius} ${radius} 0 1 1 ${cx - 0.01} ${cy - radius}`
          : `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`;

      return {
        category: cat.category,
        color: cat.meta.color,
        d,
        percentage: cat.percentage,
        count: cat.count,
        label: cat.meta.label,
        icon: cat.meta.icon,
      };
    });
  }, [processedCategories, safeTotal]);

  if (!isOpen) return null;

  const handleRefreshClick = () => {
    setIsRefreshing(true);
    onRefresh?.();
    setTimeout(() => setIsRefreshing(false), 700);
  };

  const handleDownloadCSV = () => {
    if (!analytics) return;
    let csv = "Category,Classification,Count,Percentage of Total\n";
    processedCategories.forEach((c) => {
      csv += `"${c.category}","${c.meta.label}",${c.count},${c.percentage}%\n`;
    });
    csv += "\nWard,Anomaly Count,Load Severity\n";
    sortedWards.forEach((w) => {
      const severity = w.count >= 4 ? "High" : w.count >= 2 ? "Medium" : "Normal";
      csv += `"${w.ward}",${w.count},"${severity}"\n`;
    });
    csv += `\nOverall Metrics\nTotal Anomalies,${analytics.total}\nResolved,${analytics.resolved}\nPending,${analytics.pending}\nCritical,${analytics.critical}\nResolution Rate,${analytics.resolution_rate}%\n`;

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `CityEye_Ward_Analytics_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Resolution Rate Calculations
  const resRate = analytics?.resolution_rate ?? 0;
  const resolvedCount = analytics?.resolved ?? 0;
  const pendingCount = analytics?.pending ?? 0;
  const criticalCount = analytics?.critical ?? 0;

  return createPortal(
    <div
      className="fixed inset-0 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in"
      style={{ zIndex: 999999 }}
    >
      <div
        className="relative bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
        role="dialog"
        aria-labelledby="modal-analytics-title"
      >
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-900 via-indigo-950/30 to-slate-900 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 text-xl font-bold shadow-lg shadow-indigo-500/10">
              <BarChart3 className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2 flex-wrap">
                <h2
                  id="modal-analytics-title"
                  className="text-lg font-bold text-white tracking-wide"
                >
                  City Spatial & SLA Analytics
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                  <span>LIVE TELEMETRY</span>
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Spatial ward anomaly density, SLA resolution compliance & YOLO multi-class distribution.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleRefreshClick}
              title="Refresh Live Data"
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-all active:scale-95"
            >
              <RefreshCw
                className={`w-4 h-4 ${isRefreshing ? "animate-spin text-indigo-400" : ""}`}
              />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Navigation Filter Tabs */}
        <div className="px-6 py-2.5 bg-slate-900/60 border-b border-slate-800/80 flex items-center justify-between gap-2 overflow-x-auto shrink-0">
          <div className="flex items-center space-x-1.5">
            {[
              { id: "all", label: "Overview" },
              { id: "wards", label: "Ward Breakdown" },
              { id: "sla", label: "SLA Performance" },
              { id: "yolo", label: "YOLO Hazard Classes" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === tab.id
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white text-xs font-medium transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>
          </div>
        </div>

        {/* Scrollable Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
          {/* Top KPI Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/60 flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Total Anomalies</span>
                <Layers className="w-4 h-4 text-sky-400" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black font-mono text-white">
                  {totalAnomalies}
                </span>
                <span className="text-[10px] text-slate-400 font-semibold uppercase">Logged</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                <span>Across {sortedWards.length} Municipal Wards</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/60 flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>SLA Resolution</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black font-mono text-emerald-400">
                  {resRate}%
                </span>
                <span className="text-[10px] text-slate-400 font-semibold uppercase">Closed</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                <span className="text-emerald-400 font-bold">{resolvedCount}</span> of {totalAnomalies} work orders remediated
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/60 flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Pending Action</span>
                <Clock className="w-4 h-4 text-amber-400" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black font-mono text-amber-400">
                  {pendingCount}
                </span>
                <span className="text-[10px] text-slate-400 font-semibold uppercase">In Queue</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                Municipal contractor dispatch active
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/60 flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Critical Priority</span>
                <ShieldAlert className="w-4 h-4 text-rose-400" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black font-mono text-rose-400">
                  {criticalCount}
                </span>
                <span className="text-[10px] text-slate-400 font-semibold uppercase">Critical</span>
              </div>
              <div className="text-[11px] text-rose-400 font-semibold mt-1">
                Requires &lt;12h Emergency SLA
              </div>
            </div>
          </div>

          {/* Section 1: Anomalies by Ward - High-End Bar Graph */}
          {(activeTab === "all" || activeTab === "wards") && (
            <div className="p-5 rounded-2xl bg-slate-800/30 border border-slate-700/70 shadow-lg">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 mb-4 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400">
                    <BarChart3 className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm sm:text-base font-bold text-white tracking-wide">
                        Anomalies By Ward
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30">
                        {totalAnomalies} Total Recorded
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">
                      Spatial density distribution across monitored municipal wards.
                    </p>
                  </div>
                </div>

                {/* Sort Toggle */}
                <div className="flex items-center gap-1.5 bg-slate-900/80 p-1 rounded-lg border border-slate-700/60 self-start sm:self-auto">
                  <span className="text-[10px] text-slate-400 px-2 font-medium">Sort:</span>
                  <button
                    onClick={() => setWardSort("name")}
                    className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors ${
                      wardSort === "name"
                        ? "bg-sky-600 text-white"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    Ward No.
                  </button>
                  <button
                    onClick={() => setWardSort("count")}
                    className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors ${
                      wardSort === "count"
                        ? "bg-sky-600 text-white"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    Highest Count
                  </button>
                </div>
              </div>

              {/* Graphical Ward Bar Chart */}
              <div className="pt-4 pb-2">
                <div className="h-56 flex items-end gap-2 sm:gap-3 px-2 border-b border-slate-800/80 relative">
                  {/* Horizontal Grid lines */}
                  <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20">
                    <div className="border-b border-dashed border-slate-400 w-full" />
                    <div className="border-b border-dashed border-slate-400 w-full" />
                    <div className="border-b border-dashed border-slate-400 w-full" />
                    <div className="border-b border-dashed border-slate-400 w-full" />
                  </div>

                  {sortedWards.map((w) => {
                    const barHeightPct = Math.max(Math.round((w.count / maxWardCount) * 100), 12);
                    const isHovered = hoveredWard === w.ward;
                    const isCritical = w.count >= 4;
                    const isModerate = w.count >= 2;

                    const barGradient = isCritical
                      ? "from-rose-600 to-red-500"
                      : isModerate
                      ? "from-amber-600 to-yellow-500"
                      : "from-indigo-600 to-sky-500";

                    return (
                      <div
                        key={w.ward}
                        onMouseEnter={() => setHoveredWard(w.ward)}
                        onMouseLeave={() => setHoveredWard(null)}
                        className="flex-1 flex flex-col items-center justify-end h-full group relative cursor-pointer"
                      >
                        {/* Interactive Tooltip */}
                        {isHovered && (
                          <div className="absolute -top-12 z-20 px-2.5 py-1 rounded bg-slate-950 border border-indigo-500/40 text-white text-[11px] whitespace-nowrap shadow-xl font-mono text-center">
                            <span className="font-bold">{w.ward}:</span> {w.count} incident
                            {w.count !== 1 ? "s" : ""} (
                            {Math.round((w.count / safeTotal) * 100)}%)
                          </div>
                        )}

                        {/* Top Value Pill */}
                        <span
                          className={`font-mono text-xs font-bold mb-1.5 transition-colors ${
                            isCritical
                              ? "text-rose-400"
                              : isModerate
                              ? "text-amber-400"
                              : "text-sky-300"
                          }`}
                        >
                          {w.count}
                        </span>

                        {/* Bar Body */}
                        <div className="w-full max-w-[48px] bg-slate-900/60 rounded-t-lg overflow-hidden flex items-end h-full">
                          <div
                            className={`w-full rounded-t-lg bg-gradient-to-t ${barGradient} transition-all duration-500 group-hover:brightness-125 ${
                              isHovered ? "ring-2 ring-white/50" : ""
                            }`}
                            style={{ height: `${barHeightPct}%` }}
                          />
                        </div>

                        {/* Bottom Label */}
                        <div className="mt-2 text-center w-full">
                          <span className="font-mono text-[11px] font-bold text-slate-300 block truncate group-hover:text-white">
                            {w.ward.replace("Ward ", "W")}
                          </span>
                          <span className="text-[9px] text-slate-500 hidden sm:block">
                            {w.ward}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Ward Analysis Micro Summary */}
              <div className="mt-4 pt-3 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="flex items-center gap-2 text-slate-300">
                  <MapPin className="w-3.5 h-3.5 text-sky-400" />
                  <span>
                    Highest Density:{" "}
                    <strong className="text-white">
                      {sortedWards[0]?.ward ?? "N/A"} ({sortedWards[0]?.count ?? 0})
                    </strong>
                  </span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
                  <span>
                    Avg Ward Load:{" "}
                    <strong className="text-white">
                      {(totalAnomalies / Math.max(sortedWards.length, 1)).toFixed(1)} incidents
                    </strong>
                  </span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>
                    Spread Status:{" "}
                    <strong className="text-emerald-400 font-semibold">
                      Distributed across {sortedWards.length} Zones
                    </strong>
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Section 2: SLA Resolution Performance & Hazard Distribution Side-by-Side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* SLA Resolution Performance */}
            {(activeTab === "all" || activeTab === "sla") && (
              <div className="p-5 rounded-2xl bg-slate-800/30 border border-slate-700/70 shadow-lg flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-sm sm:text-base font-bold text-white tracking-wide">
                          SLA Resolution Performance
                        </h3>
                        <p className="text-xs text-slate-400">
                          Work order turnaround and civic accountability index.
                        </p>
                      </div>
                    </div>
                    <span className="font-mono text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-full">
                      {resRate}% Resolved
                    </span>
                  </div>

                  {/* Radial Progress & Breakdown Row */}
                  <div className="flex flex-col sm:flex-row items-center gap-5 py-2">
                    {/* SVG Radial Gauge */}
                    <div className="relative w-36 h-36 flex items-center justify-center shrink-0">
                      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                        {/* Background track */}
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          strokeWidth="9"
                          className="stroke-slate-800 fill-none"
                        />
                        {/* Filled gauge */}
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          strokeWidth="9"
                          strokeDasharray={251.2}
                          strokeDashoffset={251.2 - (251.2 * resRate) / 100}
                          strokeLinecap="round"
                          className="stroke-emerald-400 fill-none transition-all duration-1000"
                        />
                      </svg>
                      <div className="absolute flex flex-col items-center justify-center text-center">
                        <span className="text-2xl font-black font-mono text-white leading-none">
                          {resRate}%
                        </span>
                        <span className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold mt-1">
                          Compliance
                        </span>
                      </div>
                    </div>

                    {/* Breakdown Metric Cards */}
                    <div className="grid grid-cols-3 gap-2 flex-1 w-full text-center">
                      <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-700/60">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                          Resolved
                        </span>
                        <span className="font-mono text-lg font-black text-emerald-400">
                          {resolvedCount}
                        </span>
                        <span className="text-[9px] text-slate-500 block mt-0.5">Closed</span>
                      </div>

                      <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-700/60">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                          Pending
                        </span>
                        <span className="font-mono text-lg font-black text-amber-400">
                          {pendingCount}
                        </span>
                        <span className="text-[9px] text-slate-500 block mt-0.5">Active</span>
                      </div>

                      <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-700/60">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                          Critical
                        </span>
                        <span className="font-mono text-lg font-black text-rose-400">
                          {criticalCount}
                        </span>
                        <span className="text-[9px] text-slate-500 block mt-0.5">&lt;12h SLA</span>
                      </div>
                    </div>
                  </div>

                  {/* Multi-Segment Horizontal Stacked Track */}
                  <div className="mt-4 pt-3 border-t border-slate-800">
                    <div className="flex justify-between text-xs text-slate-300 font-mono mb-1.5">
                      <span>Overall Resolution Metric</span>
                      <span className="font-bold text-white">
                        {resolvedCount} of {totalAnomalies} Closed
                      </span>
                    </div>
                    <div className="w-full h-3 rounded-full bg-slate-900/90 overflow-hidden flex border border-slate-700/40 p-0.5">
                      <div
                        style={{ width: `${(resolvedCount / safeTotal) * 100}%` }}
                        className="h-full bg-emerald-500 rounded-l transition-all"
                        title={`Resolved: ${resolvedCount}`}
                      />
                      <div
                        style={{
                          width: `${(Math.max(pendingCount - criticalCount, 0) / safeTotal) * 100}%`,
                        }}
                        className="h-full bg-amber-500 transition-all"
                        title={`Pending: ${pendingCount - criticalCount}`}
                      />
                      <div
                        style={{ width: `${(criticalCount / safeTotal) * 100}%` }}
                        className="h-full bg-rose-500 rounded-r transition-all"
                        title={`Critical: ${criticalCount}`}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2 font-mono">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                        <span>Resolved ({resolvedCount})</span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-amber-400" />
                        <span>Standard ({Math.max(pendingCount - criticalCount, 0)})</span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-rose-400" />
                        <span>Critical ({criticalCount})</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Hazard Distribution (YOLO Multi-Class) */}
            {(activeTab === "all" || activeTab === "yolo") && (
              <div className="p-5 rounded-2xl bg-slate-800/30 border border-slate-700/70 shadow-lg flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
                        <PieChart className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-sm sm:text-base font-bold text-white tracking-wide">
                          Hazard Distribution
                        </h3>
                        <p className="text-xs text-slate-400">
                          YOLOv12 neural multi-class segmentation breakdown.
                        </p>
                      </div>
                    </div>
                    <span className="font-mono text-[11px] font-bold text-purple-300 bg-purple-500/15 border border-purple-500/30 px-2 py-0.5 rounded-full">
                      YOLO Multi-Class
                    </span>
                  </div>

                  {/* Donut Chart + Category List Row */}
                  <div className="flex flex-col sm:flex-row items-center gap-5">
                    {/* SVG Donut Chart */}
                    <div className="relative w-36 h-36 flex items-center justify-center shrink-0">
                      <svg className="w-full h-full" viewBox="0 0 160 160">
                        {donutSlices.map((slice) => (
                          <path
                            key={slice.category}
                            d={slice.d}
                            fill="none"
                            stroke={slice.color}
                            strokeWidth={hoveredCategory === slice.category ? 22 : 18}
                            className="transition-all duration-300 cursor-pointer"
                            onMouseEnter={() => setHoveredCategory(slice.category)}
                            onMouseLeave={() => setHoveredCategory(null)}
                          />
                        ))}
                      </svg>
                      <div className="absolute flex flex-col items-center justify-center text-center pointer-events-none">
                        <span className="text-xl font-black font-mono text-white leading-none">
                          {totalAnomalies}
                        </span>
                        <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold mt-0.5">
                          Hazards
                        </span>
                      </div>
                    </div>

                    {/* Category Percentage List */}
                    <div className="space-y-2.5 flex-1 w-full">
                      {processedCategories.map((c) => {
                        const isHovered = hoveredCategory === c.category;
                        return (
                          <div
                            key={c.category}
                            onMouseEnter={() => setHoveredCategory(c.category)}
                            onMouseLeave={() => setHoveredCategory(null)}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              isHovered ? "bg-slate-800/80" : "hover:bg-slate-800/40"
                            }`}
                          >
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className="flex items-center gap-1.5 font-medium text-slate-200">
                                <span>{c.meta.icon}</span>
                                <span>{c.category.charAt(0).toUpperCase() + c.category.slice(1)}</span>
                              </span>
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-[11px] text-slate-400">
                                  {c.count} items
                                </span>
                                <span
                                  className="font-mono font-bold text-xs w-9 text-right"
                                  style={{ color: c.meta.color }}
                                >
                                  {c.percentage}%
                                </span>
                              </div>
                            </div>
                            <div className="w-full h-1.5 rounded-full bg-slate-900/80 overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{
                                  width: `${c.percentage}%`,
                                  backgroundColor: c.meta.color,
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Autonomous Vidisha Municipal Command System • YOLOv12-small RDD2022</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadCSV}
              className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-md shadow-indigo-600/20"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Report</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.getElementById("modal-root") || document.body
  );
};
