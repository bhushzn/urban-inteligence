import { useState, useEffect, useRef } from "react";
import {
  Bus,
  AlertTriangle,
  Activity,
  Plus,
  Video,
  Navigation,
  Megaphone,
  LayoutGrid,
  ChevronDown,
  LogIn,
  LogOut,
  FileBarChart2,
  Sparkles,
  Award,
  BarChart3,
  FileText
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
  onOpenAnalytics?: () => void;
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
  onOpenAnalytics,
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMouseEnter = () => {
    if (menuTimeoutRef.current) {
      clearTimeout(menuTimeoutRef.current);
      menuTimeoutRef.current = null;
    }
    setMenuOpen(true);
  };

  const handleMouseLeave = () => {
    if (menuTimeoutRef.current) {
      clearTimeout(menuTimeoutRef.current);
    }
    menuTimeoutRef.current = setTimeout(() => {
      setMenuOpen(false);
    }, 200);
  };


  useEffect(() => {
    return () => {
      if (menuTimeoutRef.current) {
        clearTimeout(menuTimeoutRef.current);
      }
    };
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



  return (
    <header className="sticky top-0 z-[5000] bg-[#090d16] border-b border-white/10 px-4 lg:px-6 py-2.5 transition-colors shadow-sm">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Brand Identity & Municipal Operations Center */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#080c14] border border-white/15 flex items-center justify-center overflow-hidden shrink-0 shadow-md p-0.5 hover:border-sky-500/50 transition-colors">
            <img
              src="/logo.png"
              alt="CityEye Command Center Logo"
              className="w-full h-full object-contain rounded-lg"
            />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-base tracking-tight leading-none">
                CityEye
              </span>
            </div>
            <p className="text-slate-400 text-[10px] font-medium mt-0.5 tracking-wide hidden 2xl:block">
              Vidisha Smart City Command & Control Center (VCCC)
            </p>
            <p className="text-slate-400 text-[10px] font-medium mt-0.5 tracking-wide hidden sm:block 2xl:hidden">
              Vidisha Municipal Command Center
            </p>
          </div>
        </div>

        {/* Center: Real-Time Operational Telemetry - Compact Pill on Laptops, Full Cards on 2XL Screens */}
        {/* Laptops (1280px - 1535px): Sleek Unified Telemetry Pill */}
        <div className="hidden xl:flex 2xl:hidden items-center gap-3 px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/5 font-mono text-[11px]">
          <div className="flex items-center gap-1.5 text-sky-400">
            <Bus className="w-3.5 h-3.5" />
            <span className="font-bold text-white">{analytics ? analytics.active_buses : 4}</span>
            <span className="text-slate-400 text-[10px]">Fleet</span>
          </div>
          <span className="text-white/15">•</span>
          <div className="flex items-center gap-1.5 text-amber-400">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span className="font-bold text-amber-300">{analytics ? analytics.total - analytics.resolved : 7}</span>
            <span className="text-slate-400 text-[10px]">Open</span>
          </div>
          <span className="text-white/15">•</span>
          <div className="flex items-center gap-1.5 text-emerald-400">
            <Activity className="w-3.5 h-3.5" />
            <span className="font-bold text-emerald-300">{analytics ? `${analytics.fleet_health}%` : "96.4%"}</span>
            <span className="text-slate-400 text-[10px]">PDI</span>
          </div>
        </div>

        {/* Large Displays (1536px+): Full Telemetry Cards */}
        <div className="hidden 2xl:flex items-center gap-2">
          {/* Active Fleet */}
          <div className="flex items-center gap-2.5 px-3 py-1.5 rounded bg-white/[0.03] border border-white/5">
            <Bus className="w-4 h-4 text-sky-400 shrink-0" />
            <div className="text-left leading-none">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block mb-0.5">
                Active Fleet
              </span>
              <span className="font-mono text-xs font-bold text-white">
                {analytics ? `${analytics.active_buses} Transit Units` : "4 Units (101-404)"}
              </span>
            </div>
          </div>

          {/* Today's Anomalies */}
          <div className="flex items-center gap-2.5 px-3 py-1.5 rounded bg-white/[0.03] border border-white/5">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <div className="text-left leading-none">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block mb-0.5">
                Active Incidents
              </span>
              <span className="font-mono text-xs font-bold text-amber-300">
                {analytics ? `${analytics.total - analytics.resolved} Open` : "7 Active"}
              </span>
            </div>
          </div>

          {/* Fleet Health Index */}
          <div className="flex items-center gap-2.5 px-3 py-1.5 rounded bg-white/[0.03] border border-white/5">
            <Activity className="w-4 h-4 text-emerald-400 shrink-0" />
            <div className="text-left leading-none">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block mb-0.5">
                Corridor Health
              </span>
              <span className="font-mono text-xs font-bold text-emerald-400">
                {analytics ? `${analytics.fleet_health}% PDI` : "96.4% Optimal"}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Operational Actions, Clock & Session Profile */}
        <div className="flex items-center gap-2.5 shrink-0">


          {/* Primary Action: Report Anomaly */}
          <button
            onClick={onReport}
            className="flex items-center gap-2 h-9 px-3.5 rounded-lg bg-red-600 hover:bg-red-500 active:bg-red-700 text-white text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Report Anomaly</span>
          </button>

          {/* High Frequency Operational Launcher: Dashcam */}
          <button
            onClick={onOpenDashcam}
            title="Live Edge Camera & Dashcam Feed"
            className="flex items-center justify-center gap-2 h-10 px-3 sm:px-4 rounded-lg bg-slate-800/80 hover:bg-slate-700/90 active:bg-slate-800 border border-slate-700/80 hover:border-slate-500/80 text-slate-200 hover:text-white text-xs font-semibold transition-all shadow-sm hover:scale-105 active:scale-95 cursor-pointer"
          >
            <Video className="w-5 h-5 text-rose-400 stroke-[2] shrink-0" />
            <span className="hidden sm:inline">Live Dashcam</span>
          </button>

          {/* High Frequency Operational Launcher: Safe Route Navigation */}
          <button
            onClick={onOpenSafeRoute}
            title="Hazard-Aware Emergency Routing Engine"
            className="flex items-center justify-center gap-2 h-10 px-3 sm:px-4 rounded-lg bg-slate-800/80 hover:bg-slate-700/90 active:bg-slate-800 border border-slate-700/80 hover:border-slate-500/80 text-slate-200 hover:text-white text-xs font-semibold transition-all shadow-sm hover:scale-105 active:scale-95 cursor-pointer"
          >
            <Navigation className="w-5 h-5 text-sky-400 stroke-[2] shrink-0" />
            <span className="hidden sm:inline">Safe Route</span>
          </button>

          {/* Citizen Portal */}
          <button
            onClick={onOpenCitizenPortal}
            title="Public Grievance Portal"
            className="flex items-center justify-center gap-2 h-10 px-3 sm:px-4 rounded-lg bg-slate-800/80 hover:bg-slate-700/90 active:bg-slate-800 border border-slate-700/80 hover:border-slate-500/80 text-slate-200 hover:text-white text-xs font-semibold transition-all shadow-sm hover:scale-105 active:scale-95 cursor-pointer"
          >
            <Megaphone className="w-5 h-5 text-emerald-400 stroke-[2] shrink-0" />
            <span className="hidden sm:inline">Citizen Portal</span>
          </button>

          {/* Dedicated Analytics Dashboard Launcher */}
          <button
            onClick={onOpenAnalytics}
            title="Ward Distribution & SLA Performance Analytics"
            className="flex items-center justify-center gap-2 h-10 px-3 sm:px-4 rounded-lg bg-slate-800/80 hover:bg-slate-700/90 active:bg-slate-800 border border-slate-700/80 hover:border-slate-500/80 text-slate-200 hover:text-white text-xs font-semibold transition-all shadow-sm hover:scale-105 active:scale-95 cursor-pointer"
          >
            <BarChart3 className="w-5 h-5 text-indigo-400 stroke-[2] shrink-0" />
            <span className="hidden sm:inline">Analytics</span>
          </button>

          {/* Command Modules Dropdown */}
          <div
            className="relative"
            ref={menuRef}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <button
              onClick={() => setMenuOpen((prev) => !prev)}
              aria-expanded={menuOpen}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded border text-xs font-medium transition-colors ${
                menuOpen
                  ? "bg-sky-500/10 border-sky-500/40 text-sky-300"
                  : "bg-white/[0.04] hover:bg-white/[0.08] border-white/10 text-slate-300 hover:text-white"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5 text-sky-400" />
              <span className="hidden md:inline">Modules</span>
              <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${menuOpen ? "rotate-180" : ""}`} />
            </button>

            {menuOpen && (
              <div
                className="absolute right-0 mt-1.5 w-64 rounded-lg bg-[#0d1424] border border-white/10 shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100"
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
              >
                <div className="px-2.5 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-white/5 mb-1">
                  Operational Command Tools
                </div>

                <button
                  onClick={() => { setMenuOpen(false); onOpenAnalytics?.(); }}
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded hover:bg-white/5 text-left text-xs text-slate-300 hover:text-white transition-colors"
                >
                  <BarChart3 className="w-4 h-4 text-indigo-400 shrink-0" />
                  <div>
                    <div className="font-semibold leading-tight">Ward & SLA Analytics</div>
                    <div className="text-[10px] text-slate-400">Spatial Density & YOLO Breakdown</div>
                  </div>
                </button>

                <button
                  onClick={() => { setMenuOpen(false); onOpenPDI?.(); }}
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded hover:bg-white/5 text-left text-xs text-slate-300 hover:text-white transition-colors"
                >
                  <BarChart3 className="w-4 h-4 text-sky-400 shrink-0" />
                  <div>
                    <div className="font-semibold leading-tight">Corridor PDI Analytics</div>
                    <div className="text-[10px] text-slate-400">Pavement Distress & Forecasting</div>
                  </div>
                </button>

                <button
                  onClick={() => { setMenuOpen(false); onOpenExecutiveReport?.(); }}
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded hover:bg-white/5 text-left text-xs text-slate-300 hover:text-white transition-colors"
                >
                  <FileText className="w-4 h-4 text-amber-400 shrink-0" />
                  <div>
                    <div className="font-semibold leading-tight">Executive Audit Report</div>
                    <div className="text-[10px] text-slate-400">Contractor SLA Compliance</div>
                  </div>
                </button>

                <button
                  onClick={() => { setMenuOpen(false); onOpenKarma?.(); }}
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded hover:bg-white/5 text-left text-xs text-slate-300 hover:text-white transition-colors"
                >
                  <Award className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div>
                    <div className="font-semibold leading-tight">Civic Karma & Rewards</div>
                    <div className="text-[10px] text-slate-400">Community Leaderboard</div>
                  </div>
                </button>

                <button
                  onClick={() => { setMenuOpen(false); onExport(); }}
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded hover:bg-white/5 text-left text-xs text-slate-300 hover:text-white transition-colors"
                >
                  <FileBarChart2 className="w-4 h-4 text-cyan-400 shrink-0" />
                  <div>
                    <div className="font-semibold leading-tight">Export Telemetry CSV</div>
                    <div className="text-[10px] text-slate-400">Municipal Audit Log Download</div>
                  </div>
                </button>

                <div className="border-t border-white/5 my-1" />

                <button
                  onClick={() => { setMenuOpen(false); onOpenShowcase?.(); }}
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded hover:bg-white/5 text-left text-xs text-slate-300 hover:text-white transition-colors"
                >
                  <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />
                  <div>
                    <div className="font-semibold leading-tight">Architecture Specification</div>
                    <div className="text-[10px] text-slate-400">AI Vision & System Architecture</div>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* User Profile / Authentication */}
          {user ? (
            <div className="flex items-center gap-2 pl-2 border-l border-white/10">
              <div className="text-right leading-tight hidden md:block">
                <span className="font-semibold text-xs text-white block">{user.name}</span>
                <span className="text-[10px] font-mono text-sky-400 capitalize">{user.role}</span>
              </div>
              <button
                onClick={onLogout}
                title="Sign Out"
                className="w-8 h-8 rounded bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-slate-400 hover:text-rose-400 flex items-center justify-center transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={onLoginClick}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-slate-300 hover:text-white text-xs font-semibold transition-colors"
            >
              <LogIn className="w-3.5 h-3.5 text-sky-400" />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
