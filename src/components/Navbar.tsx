import { useState, useEffect } from "react";
import { Activity, AlertTriangle, Bus, FileBarChart2, Radio, Clock, PlusCircle } from "lucide-react";
import type { Analytics } from "../api";

interface Props {
  onExport: () => void;
  onReport: () => void;
  analytics: Analytics | null;
}

export default function Navbar({ onExport, onReport, analytics }: Props) {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  const timeStr = time.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const dateStr = time.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

  return (
    <header className="glass glow-cyan sticky top-0 z-50 px-6 py-3 rounded-2xl mx-4 mt-4">
      <div className="flex items-center justify-between gap-4">
        {/* Logo */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/30 to-cyan-900/60 flex items-center justify-center border border-cyan-500/30">
            <Radio className="w-5 h-5 text-cyan-400" />
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-cyan-400 blink border-2 border-slate-900" />
          </div>
          <div>
            <h1 className="font-display font-bold text-white text-lg leading-none tracking-wide">
              UrbanIntel <span className="text-cyan-400">AI</span>
            </h1>
            <p className="text-slate-500 text-xs font-medium mt-0.5">Smart City Command Center • SIH-26124</p>
          </div>
        </div>

        {/* Stats — live from API */}
        <div className="flex items-center gap-2 flex-1 justify-center flex-wrap">
          <StatChip
            icon={<Bus className="w-3.5 h-3.5 text-cyan-400" />}
            label="Active Buses"
            value={analytics ? String(analytics.active_buses) : "—"}
            color="cyan"
          />
          <StatChip
            icon={<AlertTriangle className="w-3.5 h-3.5 text-amber-400" />}
            label="Anomalies Today"
            value={analytics ? String(analytics.total) : "—"}
            color="amber"
          />
          <StatChip
            icon={<Activity className="w-3.5 h-3.5 text-emerald-400" />}
            label="Fleet Health"
            value={analytics ? `${analytics.fleet_health}%` : "—"}
            color="green"
          />
        </div>

        {/* Clock */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/40 border border-slate-700/30 shrink-0">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <div className="text-xs">
            <p className="text-white font-mono font-semibold leading-none">{timeStr}</p>
            <p className="text-slate-500 leading-none mt-0.5">{dateStr}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onReport}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-semibold hover:bg-red-500/20 hover:border-red-400/50 transition-all duration-200"
          >
            <PlusCircle className="w-4 h-4" />
            Report
          </button>
          <button
            onClick={onExport}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-sm font-semibold hover:bg-cyan-500/20 hover:border-cyan-400/50 transition-all duration-200"
          >
            <FileBarChart2 className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>
    </header>
  );
}

function StatChip({ icon, label, value, color }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: "cyan" | "amber" | "green";
}) {
  const borderColor = color === "cyan" ? "border-cyan-500/25" : color === "amber" ? "border-amber-500/25" : "border-emerald-500/25";
  const textColor   = color === "cyan" ? "text-cyan-400"      : color === "amber" ? "text-amber-400"      : "text-emerald-400";
  const bgColor     = color === "cyan" ? "bg-cyan-500/8"      : color === "amber" ? "bg-amber-500/8"      : "bg-emerald-500/8";
  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${bgColor} border ${borderColor}`}>
      {icon}
      <div className="text-xs">
        <span className="text-slate-400">{label}: </span>
        <span className={`font-bold ${textColor}`}>{value}</span>
      </div>
    </div>
  );
}
