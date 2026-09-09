import { useState, useEffect, useRef } from "react";
import {
  Activity,
  AlertTriangle,
  Bus,
  FileBarChart2,
  Radio,
  Clock,
  PlusCircle,
  LogIn,
  LogOut,
  ShieldCheck,
  HardHat,
  Sparkles,
  ChevronDown,
  LayoutGrid,
  Video,
  Navigation,
  Megaphone,
  Award
} from "lucide-react";
import type { Analytics, User } from "../api";

interface Props {
  onExport: () => void;
  onReport: () => void;
  analytics: Analytics | null;
  user: User | null;
  onLoginClick: () => void;
  onLogout: () => void;
  onOpenShowcase?: () => void;
  onOpenCitizenPortal?: () => void;
  onOpenPDI?: () => void;
  onOpenExecutiveReport?: () => void;
  onOpenSafeRoute?: () => void;
  onOpenDashcam?: () => void;
  onOpenKarma?: () => void;
}

export default function Navbar({
  onExport,
  onReport,
  analytics,
  user,
  onLoginClick,
  onLogout,
  onOpenShowcase,
  onOpenCitizenPortal,
  onOpenPDI,
  onOpenExecutiveReport,
  onOpenSafeRoute,
  onOpenDashcam,
  onOpenKarma,
}: Props) {
  const [time, setTime] = useState(new Date());
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const timeStr = time.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const dateStr = time.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

  return (
    <header className="glass glow-cyan sticky top-0 z-40 px-5 py-3 rounded-2xl mx-4 mt-4 transition-all">
      <div className="flex items-center justify-between gap-3 lg:gap-5">
        
        {/* Left: Brand Logo & Title */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/30 to-blue-900/60 flex items-center justify-center border border-cyan-500/40 shadow-inner">
            <Radio className="w-5 h-5 text-cyan-400" />
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-cyan-400 blink border-2 border-slate-900" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display font-extrabold text-white text-lg leading-none tracking-wide">
                CityEye
              </h1>
              <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 rounded-md">
                Live
              </span>
            </div>
            <p className="text-slate-400 text-[11px] font-medium mt-0.5 hidden sm:block">
              Smart City Command Center
            </p>
          </div>
        </div>

        {/* Center: Live Telemetry Stat Chips (Never Wraps) */}
        <div className="hidden lg:flex items-center gap-2.5 shrink-0">
          <StatChip
            icon={<Bus className="w-3.5 h-3.5 text-cyan-400" />}
            label="Active Buses"
            value={analytics ? String(analytics.active_buses) : "14"}
            color="cyan"
          />
          <StatChip
            icon={<AlertTriangle className="w-3.5 h-3.5 text-amber-400" />}
            label="Anomalies Today"
            value={analytics ? String(analytics.total) : "48"}
            color="amber"
          />
          <StatChip
            icon={<Activity className="w-3.5 h-3.5 text-emerald-400" />}
            label="Fleet Health"
            value={analytics ? `${analytics.fleet_health}%` : "96%"}
            color="green"
          />
        </div>

        {/* Right: Quick Actions, Tools Menu, Clock & Auth */}
        <div className="flex items-center gap-2 shrink-0">
          
          {/* Live Digital Clock */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-850/80 border border-slate-700/50 shrink-0">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <div className="text-xs">
              <p className="text-white font-mono font-semibold leading-none tracking-tight">{timeStr}</p>
              <p className="text-slate-400 text-[10px] leading-none mt-0.5">{dateStr}</p>
            </div>
          </div>

          {/* Primary Quick Action: Report Incident */}
          <button
            onClick={onReport}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-red-600/90 to-rose-600/90 hover:from-red-500 hover:to-rose-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-red-900/30 border border-red-400/40 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Report</span>
          </button>

          {/* High-frequency Module: Dashcam Stream */}
          <button
            onClick={onOpenDashcam}
            title="Live Transit Fleet Edge AI Dashcam Stream"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 hover:text-white text-xs sm:text-sm font-semibold transition-all duration-200"
          >
            <Video className="w-4 h-4 text-rose-400" />
            <span className="hidden xl:inline">Dashcam</span>
          </button>

          {/* High-frequency Module: Safe Route Navigation */}
          <button
            onClick={onOpenSafeRoute}
            title="Safe-Route Hazard-Aware Emergency Navigation"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-300 hover:text-white text-xs sm:text-sm font-semibold transition-all duration-200"
          >
            <Navigation className="w-4 h-4 text-blue-400" />
            <span className="hidden xl:inline">Safe Route</span>
          </button>

          {/* High-frequency Module: Citizen Portal */}
          <button
            onClick={onOpenCitizenPortal}
            title="Public Citizen Reporting Portal"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 hover:text-white text-xs sm:text-sm font-semibold transition-all duration-200"
          >
            <Megaphone className="w-4 h-4 text-emerald-400" />
            <span className="hidden xl:inline">Citizen Portal</span>
          </button>

          {/* Command Tools & Analytics Dropdown */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs sm:text-sm font-semibold transition-all duration-200 ${
                menuOpen
                  ? "bg-cyan-500/20 border-cyan-400/60 text-cyan-200 shadow-md shadow-cyan-900/40"
                  : "bg-slate-800/80 hover:bg-slate-700/80 border-slate-700 text-slate-200"
              }`}
            >
              <LayoutGrid className="w-4 h-4 text-cyan-400" />
              <span className="hidden sm:inline">Tools & Analytics</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${menuOpen ? "rotate-180" : ""}`} />
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 mb-1">
                  Command Center Modules
                </div>

                <button
                  onClick={() => { setMenuOpen(false); onOpenPDI?.(); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-indigo-500/15 text-left text-xs font-semibold text-slate-200 hover:text-indigo-300 transition-colors"
                >
                  <span className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">📊</span>
                  <div>
                    <p className="leading-tight">Corridor PDI Analytics</p>
                    <p className="text-[10px] text-slate-400 font-normal">Pavement Distress & Forecasting</p>
                  </div>
                </button>

                <button
                  onClick={() => { setMenuOpen(false); onOpenExecutiveReport?.(); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-amber-500/15 text-left text-xs font-semibold text-slate-200 hover:text-amber-300 transition-colors"
                >
                  <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">📋</span>
                  <div>
                    <p className="leading-tight">Executive Audit Report</p>
                    <p className="text-[10px] text-slate-400 font-normal">Official BMC SLA Compliance</p>
                  </div>
                </button>

                <button
                  onClick={() => { setMenuOpen(false); onOpenKarma?.(); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-emerald-500/15 text-left text-xs font-semibold text-slate-200 hover:text-emerald-300 transition-colors"
                >
                  <Award className="w-4 h-4 text-emerald-400 shrink-0 ml-1" />
                  <div>
                    <p className="leading-tight">Civic Karma & Rewards</p>
                    <p className="text-[10px] text-slate-400 font-normal">Citizen Points & Leaderboard</p>
                  </div>
                </button>

                <button
                  onClick={() => { setMenuOpen(false); onExport(); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-cyan-500/15 text-left text-xs font-semibold text-slate-200 hover:text-cyan-300 transition-colors"
                >
                  <FileBarChart2 className="w-4 h-4 text-cyan-400 shrink-0 ml-1" />
                  <div>
                    <p className="leading-tight">Export Telemetry CSV</p>
                    <p className="text-[10px] text-slate-400 font-normal">Download Incident Raw Dataset</p>
                  </div>
                </button>

                <div className="border-t border-slate-800 my-1" />

                <button
                  onClick={() => { setMenuOpen(false); onOpenShowcase?.(); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-purple-500/15 text-left text-xs font-semibold text-slate-200 hover:text-purple-300 transition-colors"
                >
                  <Sparkles className="w-4 h-4 text-purple-400 shrink-0 ml-1" />
                  <div>
                    <p className="leading-tight">Project Architecture</p>
                    <p className="text-[10px] text-slate-400 font-normal">AI Pipeline & System Overview</p>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* User Auth Section */}
          {user ? (
            <div className="flex items-center gap-2 pl-1 sm:pl-2 border-l border-slate-700/60">
              <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/70 shadow-sm">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                  user.role === "admin" 
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30" 
                    : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                }`}>
                  {user.role === "admin" ? <ShieldCheck className="w-4 h-4" /> : <HardHat className="w-4 h-4" />}
                </div>
                <div className="text-left hidden md:block">
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
                className="p-2 rounded-xl bg-slate-800/60 hover:bg-red-500/15 border border-slate-700/60 hover:border-red-500/40 text-slate-400 hover:text-red-400 transition-all duration-200"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onLoginClick}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs sm:text-sm shadow-md shadow-cyan-500/20 transition-all duration-200"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In</span>
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
  const borderColor = color === "cyan" ? "border-cyan-500/30" : color === "amber" ? "border-amber-500/30" : "border-emerald-500/30";
  const textColor   = color === "cyan" ? "text-cyan-400"      : color === "amber" ? "text-amber-400"      : "text-emerald-400";
  const bgColor     = color === "cyan" ? "bg-cyan-500/10"     : color === "amber" ? "bg-amber-500/10"     : "bg-emerald-500/10";
  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl ${bgColor} border ${borderColor} whitespace-nowrap shadow-sm`}>
      {icon}
      <div className="text-xs flex items-center gap-1.5">
        <span className="text-slate-400 font-medium">{label}:</span>
        <span className={`font-bold font-mono ${textColor}`}>{value}</span>
      </div>
    </div>
  );
}
