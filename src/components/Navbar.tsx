import { useState, useEffect } from "react";
import { Activity, AlertTriangle, Bus, FileBarChart2, Radio, Clock, PlusCircle, LogIn, LogOut, ShieldCheck, HardHat, Sparkles } from "lucide-react";
import type { Analytics, User } from "../api";

interface Props {
  onExport: () => void;
  onReport: () => void;
  analytics: Analytics | null;
  user: User | null;
  onLoginClick: () => void;
  onLogout: () => void;
  onOpenShowcase?: () => void;
}

export default function Navbar({ onExport, onReport, analytics, user, onLoginClick, onLogout, onOpenShowcase }: Props) {
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
          <button
            onClick={onOpenShowcase}
            title="Project Overview & SIH 26124 Details"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-300 text-sm font-semibold hover:bg-purple-500/20 hover:border-purple-400/50 transition-all duration-200"
          >
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span className="hidden lg:inline">SIH 26124</span>
          </button>

          {/* User Auth Section */}
          {user ? (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-700/60">
              <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                  user.role === "admin" 
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30" 
                    : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                }`}>
                  {user.role === "admin" ? <ShieldCheck className="w-4 h-4" /> : <HardHat className="w-4 h-4" />}
                </div>
                <div className="text-left hidden sm:block">
                  <p className="text-xs font-semibold text-white leading-tight">{user.name}</p>
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${
                    user.role === "admin" ? "text-cyan-400" : "text-amber-400"
                  }`}>
                    {user.role === "admin" ? "Admin" : "Field Agent"}
                  </span>
                </div>
              </div>
              <button
                onClick={onLogout}
                title="Sign Out"
                className="p-2 rounded-xl bg-slate-800/40 hover:bg-red-500/10 border border-slate-700/40 hover:border-red-500/30 text-slate-400 hover:text-red-400 transition-all duration-200"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onLoginClick}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-sm shadow-md shadow-cyan-500/20 transition-all duration-200 ml-1"
            >
              <LogIn className="w-4 h-4" />
              Sign In
            </button>
          )}
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
