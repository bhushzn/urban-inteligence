import type { Analytics } from "../api";
import { BarChart2, CheckCircle, PieChart } from "lucide-react";

interface Props {
  analytics: Analytics | null;
}

export default function AnalyticsPanel({ analytics }: Props) {
  if (!analytics) return null;

  const maxWard = Math.max(...(analytics.ward_breakdown.map(w => w.count)), 1);
  const total = analytics.total || 1;

  const catColors: Record<string, string> = {
    road:           "#f87171",
    bus_lane:       "#ec4899",
    garbage:        "#fb923c",
    water:          "#38bdf8",
    infrastructure: "#fbbf24",
    encroachment:   "#a78bfa",
    animal:         "#34d399",
    other:          "#94a3b8",
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {/* Anomalies by Municipal Ward */}
      <div className="cmd-surface rounded-lg p-3.5 border border-white/10">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-sky-400" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              Anomalies By Ward
            </span>
          </div>
          <span className="font-mono text-[11px] text-slate-400 font-semibold">{analytics.total} Total</span>
        </div>

        <div className="flex items-end gap-1.5 h-24 pt-2">
          {analytics.ward_breakdown.slice(0, 8).map((w) => {
            const h = Math.round((w.count / maxWard) * 100);
            const isHigh = w.count >= maxWard * 0.7;
            const isMed = w.count >= maxWard * 0.4;
            const barBg = isHigh ? "#ef4444" : isMed ? "#f59e0b" : "#0284c7";

            return (
              <div key={w.ward} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                <span className="font-mono text-[9px] text-slate-300 font-bold">{w.count}</span>
                <div className="w-full h-16 bg-white/[0.03] rounded-t flex items-end">
                  <div
                    className="w-full rounded-t transition-all duration-500"
                    style={{
                      height: `${Math.max(h, 8)}%`,
                      backgroundColor: barBg,
                    }}
                  />
                </div>
                <span className="font-mono text-[8px] text-slate-400 truncate w-full text-center">
                  {w.ward.replace("Ward ", "W")}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Resolution & SLA Rate */}
      <div className="cmd-surface rounded-lg p-3 sm:p-3.5 border border-white/10">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              SLA Resolution Performance
            </span>
          </div>
          <span className="font-mono text-[11px] font-bold text-emerald-400">
            {analytics.resolution_rate}% Resolved
          </span>
        </div>

        <div className="grid grid-cols-3 gap-1.5 py-2 text-center">
          <div className="p-1.5 rounded bg-white/[0.02] border border-white/5">
            <span className="text-[9px] uppercase font-semibold text-slate-400 block mb-0.5 truncate">Resolved</span>
            <span className="font-mono text-sm sm:text-base font-bold text-emerald-400">{analytics.resolved}</span>
          </div>
          <div className="p-1.5 rounded bg-white/[0.02] border border-white/5">
            <span className="text-[9px] uppercase font-semibold text-slate-400 block mb-0.5 truncate">Pending</span>
            <span className="font-mono text-sm sm:text-base font-bold text-amber-400">{analytics.pending}</span>
          </div>
          <div className="p-1.5 rounded bg-white/[0.02] border border-white/5">
            <span className="text-[9px] uppercase font-semibold text-slate-400 block mb-0.5 truncate">Critical</span>
            <span className="font-mono text-sm sm:text-base font-bold text-red-400">{analytics.critical}</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-2.5">
          <div className="flex justify-between text-[10px] text-slate-400 font-mono mb-1">
            <span>Overall Resolution Metric</span>
            <span className="text-slate-200 font-semibold">{analytics.resolved} of {analytics.total} Closed</span>
          </div>
          <div className="w-full h-2 rounded bg-white/[0.05] overflow-hidden flex">
            <div
              style={{ width: `${(analytics.resolved / total) * 100}%` }}
              className="h-full bg-emerald-500"
            />
            <div
              style={{ width: `${((analytics.pending - analytics.critical) / total) * 100}%` }}
              className="h-full bg-amber-500"
            />
            <div
              style={{ width: `${(analytics.critical / total) * 100}%` }}
              className="h-full bg-red-500"
            />
          </div>
        </div>
      </div>

      {/* Hazard Category Distribution */}
      <div className="cmd-surface rounded-lg p-3 sm:p-3.5 border border-white/10">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <PieChart className="w-4 h-4 text-purple-400" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              Hazard Distribution
            </span>
          </div>
          <span className="font-mono text-[11px] text-slate-400">YOLO Multi-Class</span>
        </div>

        <div className="space-y-1.5 pt-0.5">
          {analytics.category_breakdown.slice(0, 5).map((c) => {
            const pct = Math.round((c.count / total) * 100);
            const color = catColors[c.category] ?? "#94a3b8";
            const label = c.category === "bus_lane" ? "Bus Lane" : c.category.charAt(0).toUpperCase() + c.category.slice(1);

            return (
              <div key={c.category} className="flex items-center gap-2 text-xs">
                <span className="text-slate-300 w-20 sm:w-24 truncate text-[11px] font-medium">{label}</span>
                <div className="flex-1 h-2 rounded bg-white/[0.05] overflow-hidden">
                  <div
                    className="h-full rounded"
                    style={{ width: `${pct}%`, backgroundColor: color }}
                  />
                </div>
                <span className="font-mono text-[11px] font-semibold w-8 text-right text-slate-300">
                  {pct}%
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
