import type { Analytics } from "../api";

interface Props {
  analytics: Analytics | null;
}

export default function AnalyticsPanel({ analytics }: Props) {
  if (!analytics) return (
    <div className="grid grid-cols-3 gap-4 mt-4">
      {[1,2,3].map(i => (
        <div key={i} className="glass glow-cyan rounded-2xl p-4 animate-pulse">
          <div className="h-4 w-32 bg-slate-700/50 rounded mb-4" />
          <div className="h-24 bg-slate-800/50 rounded" />
        </div>
      ))}
    </div>
  );

  const maxWard = Math.max(...(analytics.ward_breakdown.map(w => w.count)), 1);
  const total = analytics.total || 1;

  const catColors: Record<string, string> = {
    road:           "#ef4444",
    garbage:        "#f97316",
    water:          "#3b82f6",
    infrastructure: "#fbbf24",
    encroachment:   "#8b5cf6",
    animal:         "#22d3ee",
    other:          "#64748b",
  };

  return (
    <div className="grid grid-cols-3 gap-4 mt-4">
      {/* Anomalies by Ward */}
      <div className="glass glow-cyan rounded-2xl p-4 float-card">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1.5 h-5 rounded-full bg-cyan-400" />
          <h3 className="text-sm font-semibold text-slate-200 font-display">Anomalies by Ward</h3>
          <span className="ml-auto text-xs text-slate-500">{analytics.total} total</span>
        </div>
        <div className="flex items-end gap-1.5 h-24">
          {analytics.ward_breakdown.slice(0, 7).map(w => {
            const h = Math.round((w.count / maxWard) * 100);
            const isHigh = w.count >= maxWard * 0.7;
            const isMed  = w.count >= maxWard * 0.4;
            return (
              <div key={w.ward} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[9px] text-slate-400 font-medium">{w.count}</span>
                <div className="w-full flex items-end" style={{ height: "72px" }}>
                  <div className="w-full rounded-t-md transition-all duration-700"
                    style={{
                      height: `${h}%`,
                      background: isHigh ? "linear-gradient(to top, #ef4444, #f97316)"
                        : isMed          ? "linear-gradient(to top, #fbbf24, #f59e0b)"
                        :                  "linear-gradient(to top, #22d3ee, #06b6d4)",
                      boxShadow: isHigh ? "0 0 8px rgba(239,68,68,0.4)"
                        : isMed          ? "0 0 8px rgba(251,191,36,0.3)"
                        :                  "0 0 8px rgba(34,211,238,0.3)",
                    }}
                  />
                </div>
                <span className="text-[8px] text-slate-500 truncate w-full text-center">{w.ward.replace("Ward ", "W")}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Resolution Rate */}
      <div className="glass glow-amber rounded-2xl p-4 float-card">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-1.5 h-5 rounded-full bg-amber-400" />
          <h3 className="text-sm font-semibold text-slate-200 font-display">Resolution Rate</h3>
        </div>
        <div className="flex items-center justify-center gap-4">
          <RadialProgress
            value={Math.round((analytics.resolved / total) * 100)}
            color="#22d3ee"
            label="Resolved"
          />
          <RadialProgress
            value={Math.round(((analytics.pending - analytics.critical) / total) * 100)}
            color="#fbbf24"
            label="Pending"
          />
          <RadialProgress
            value={Math.round((analytics.critical / total) * 100)}
            color="#ef4444"
            label="Critical"
          />
        </div>
        <div className="mt-2 flex justify-between text-[10px] text-slate-500 px-1">
          <span>Total: {analytics.total} anomalies</span>
          <span className="text-emerald-400 font-semibold">{analytics.resolution_rate}% resolved</span>
        </div>
      </div>

      {/* Hazard Breakdown */}
      <div className="glass glow-red rounded-2xl p-4 float-card">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-1.5 h-5 rounded-full bg-red-400" />
          <h3 className="text-sm font-semibold text-slate-200 font-display">Hazard Breakdown</h3>
        </div>
        <div className="flex flex-col gap-2">
          {analytics.category_breakdown.slice(0, 6).map(c => {
            const pct = Math.round((c.count / total) * 100);
            const color = catColors[c.category] ?? "#64748b";
            const label = c.category.charAt(0).toUpperCase() + c.category.slice(1);
            return (
              <div key={c.category} className="flex items-center gap-2">
                <span className="text-xs text-slate-400 w-20 shrink-0 truncate">{label}</span>
                <div className="flex-1 h-2 rounded-full bg-slate-800/60 overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${pct}%`, background: color, boxShadow: `0 0 6px ${color}80` }}
                  />
                </div>
                <span className="text-xs font-semibold shrink-0 w-8 text-right" style={{ color }}>{pct}%</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function RadialProgress({ value, color, label }: { value: number; color: string; label: string }) {
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const dash = (Math.max(0, Math.min(100, value)) / 100) * circumference;
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative w-16 h-16">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 70 70">
          <circle cx="35" cy="35" r={radius} fill="none" stroke="rgba(30,41,59,0.8)" strokeWidth="6" />
          <circle cx="35" cy="35" r={radius} fill="none" stroke={color} strokeWidth="6"
            strokeLinecap="round" strokeDasharray={`${dash} ${circumference}`}
            style={{ filter: `drop-shadow(0 0 4px ${color})` }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-bold text-white">{value}%</span>
        </div>
      </div>
      <span className="text-[10px] text-slate-400 font-medium">{label}</span>
    </div>
  );
}
