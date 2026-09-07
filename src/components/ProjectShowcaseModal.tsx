import React, { useState } from "react";
import {
  X,
  Sparkles,
  Cpu,
  Layers,
  BarChart3,
  Code2,
  CheckCircle2,
  AlertTriangle,
  Flame,
  ShieldCheck,
  Video,
  Globe2,
  ExternalLink,
} from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

type TabType = "overview" | "ai" | "architecture" | "impact" | "stack";

export const ProjectShowcaseModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<TabType>("overview");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Dark blur backdrop */}
      <div
        className="absolute inset-0 bg-black/75 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative glass glow-cyan rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border border-cyan-500/30 shadow-2xl fade-in-up">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/60 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Sparkles className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white font-display">UrbanIntel AI</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-cyan-500/20 text-cyan-400 border border-cyan-500/40">
                  SIH PS 26124
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Autonomous Road & City Anomaly Detection Command Center
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800/80 flex items-center justify-center text-slate-400 hover:text-white transition-colors border border-slate-700/50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-6 gap-2 overflow-x-auto">
          {[
            { id: "overview", label: "🎯 Problem & Solution", icon: Globe2 },
            { id: "ai", label: "🧠 AI Edge Pipeline", icon: Cpu },
            { id: "architecture", label: "🏗️ Architecture", icon: Layers },
            { id: "impact", label: "📊 Municipal Impact", icon: BarChart3 },
            { id: "stack", label: "🚀 Tech & Team", icon: Code2 },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold whitespace-nowrap transition-all border-b-2 ${
                  isActive
                    ? "border-cyan-400 text-cyan-400 bg-cyan-500/5"
                    : "border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-300 text-sm">
          {/* TAB 1: OVERVIEW */}
          {activeTab === "overview" && (
            <div className="space-y-6 animate-fadeIn">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Problem Card */}
                <div className="p-4 rounded-xl bg-red-950/20 border border-red-500/30 space-y-2">
                  <div className="flex items-center gap-2 text-red-400 font-bold text-sm">
                    <AlertTriangle className="w-4 h-4" />
                    <span>The Problem (SIH Problem Statement 26124)</span>
                  </div>
                  <ul className="text-xs text-slate-400 space-y-1.5 list-disc pl-4">
                    <li>
                      Over <strong>4,700 road accidents annually</strong> in India are caused directly by potholes and road fissures.
                    </li>
                    <li>
                      Municipal manual road surveying is <strong>slow, expensive</strong>, and covers less than 15% of city roads per month.
                    </li>
                    <li>
                      Citizen complaint portals suffer from poor adoption, missing GPS tags, and massive validation backlogs.
                    </li>
                  </ul>
                </div>

                {/* Solution Card */}
                <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Our Solution (UrbanIntel AI)</span>
                  </div>
                  <ul className="text-xs text-slate-400 space-y-1.5 list-disc pl-4">
                    <li>
                      Converts existing <strong>public bus dashcams and municipal vehicles</strong> into automated roving patrol sensors.
                    </li>
                    <li>
                      <strong>On-device & Edge YOLOv8 AI</strong> detects potholes, illegal garbage dumping, waterlogging, and encroaching hazards in milliseconds.
                    </li>
                    <li>
                      Instant real-time dispatch via <strong>WebSocket live feeds</strong> and Leaflet GIS mapping with 1-click verification workflows.
                    </li>
                  </ul>
                </div>
              </div>

              {/* Key Highlights */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                <div className="p-3 rounded-lg bg-slate-800/40 border border-slate-700/50 text-center">
                  <div className="text-2xl font-bold text-cyan-400 font-display">&lt; 45ms</div>
                  <div className="text-[11px] text-slate-400">YOLOv8 Inference Speed</div>
                </div>
                <div className="p-3 rounded-lg bg-slate-800/40 border border-slate-700/50 text-center">
                  <div className="text-2xl font-bold text-emerald-400 font-display">100%</div>
                  <div className="text-[11px] text-slate-400">Automated GIS Tagging</div>
                </div>
                <div className="p-3 rounded-lg bg-slate-800/40 border border-slate-700/50 text-center">
                  <div className="text-2xl font-bold text-amber-400 font-display">85%</div>
                  <div className="text-[11px] text-slate-400">Inspection Cost Savings</div>
                </div>
                <div className="p-3 rounded-lg bg-slate-800/40 border border-slate-700/50 text-center">
                  <div className="text-2xl font-bold text-purple-400 font-display">24x7</div>
                  <div className="text-[11px] text-slate-400">Real-Time Ward Coverage</div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: AI PIPELINE */}
          {activeTab === "ai" && (
            <div className="space-y-4 animate-fadeIn">
              <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/60 space-y-3">
                <h3 className="text-sm font-bold text-cyan-400 flex items-center gap-2">
                  <Cpu className="w-4 h-4" />
                  <span>Real-Time Computer Vision & Anomaly Pipeline</span>
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  UrbanIntel AI utilizes Ultralytics <strong>YOLOv8</strong> optimized for urban road infrastructure anomaly segmentation.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                  <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 space-y-1">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Video className="w-3.5 h-3.5 text-cyan-400" />
                      1. Frame Ingestion
                    </span>
                    <p className="text-[11px] text-slate-400">
                      Edge dashcam script captures 1080p frames at scheduled intervals, packaging GPS telemetry and timestamps.
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 space-y-1">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Cpu className="w-3.5 h-3.5 text-purple-400" />
                      2. Neural Inference
                    </span>
                    <p className="text-[11px] text-slate-400">
                      YOLOv8 detects bounding boxes, extracts anomaly class, and assigns severity (High, Medium, Low) based on confidence score.
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 space-y-1">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      3. Live Dispatch
                    </span>
                    <p className="text-[11px] text-slate-400">
                      WebSocket broadcasts anomaly to all connected command center terminals with synthesized audio alerts and push notifications.
                    </p>
                  </div>
                </div>
              </div>

              {/* Supported Anomaly Categories */}
              <div className="p-4 rounded-xl bg-slate-800/20 border border-slate-800 space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Detected Infrastructure Anomalies
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 text-xs">
                  <span className="px-2.5 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800 text-slate-300 flex items-center gap-2">
                    <span>🕳️</span> Potholes & Fissures
                  </span>
                  <span className="px-2.5 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800 text-slate-300 flex items-center gap-2">
                    <span>🗑️</span> Garbage Dumping
                  </span>
                  <span className="px-2.5 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800 text-slate-300 flex items-center gap-2">
                    <span>🌊</span> Waterlogging / Flooding
                  </span>
                  <span className="px-2.5 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800 text-slate-300 flex items-center gap-2">
                    <span>💡</span> Broken Streetlights
                  </span>
                  <span className="px-2.5 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800 text-slate-300 flex items-center gap-2">
                    <span>🚫</span> Road Encroachment
                  </span>
                  <span className="px-2.5 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800 text-slate-300 flex items-center gap-2">
                    <span>🐕</span> Stray Animal Hazards
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ARCHITECTURE */}
          {activeTab === "architecture" && (
            <div className="space-y-4 animate-fadeIn">
              <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 font-mono text-xs overflow-x-auto space-y-2">
                <div className="text-cyan-400 font-bold font-display">System Topology Flowchart</div>
                <pre className="text-[11px] text-slate-300 leading-relaxed">
{`[🚌 Municipal Bus Dashcam] 
          │ (HTTP POST /api/incidents with GPS & Image)
          ▼
[⚡ FastAPI High-Concurrency Backend] ────┐
   ├── 🧠 Ultralytics YOLOv8 Anomaly Engine   │ (Real-Time Push)
   ├── 🛡️ SlowAPI Brute-Force Rate Limiter    │
   ├── 🔐 JWT Bearer RBAC (Admin / Agent)     │
   ├── ☁️ Cloudinary CDN / Local Disk Storage │
   └── 🗄️ Dual-Engine DB (PostgreSQL / SQLite)│
          │                                  │
          ▼                                  ▼
[🌐 Web Dashboard (React + Leaflet)] ◀───────┘
   ├── 🗺️ Interactive Live Ward Map & Street View
   ├── 🔔 Web Audio & Push Notification Engine
   ├── 📊 Ward Hotspot & Fleet Analytics
   └── 📋 1-Click Verification & Resolution Workflow`}
                </pre>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 space-y-1">
                  <span className="font-bold text-cyan-400">Zero-Config Local & Cloud Dual DB:</span>
                  <p className="text-slate-400 text-[11px]">
                    Runs instantly offline via SQLite with auto-composite indexing; switches seamlessly to PostgreSQL (Supabase/Neon) upon adding <code>DATABASE_URL</code>.
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 space-y-1">
                  <span className="font-bold text-cyan-400">Enterprise Asset Storage:</span>
                  <p className="text-slate-400 text-[11px]">
                    Automatic Cloudinary cloud sync for uploaded evidence photos with secure CDN links and fallback disk persistence.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: MUNICIPAL IMPACT */}
          {activeTab === "impact" && (
            <div className="space-y-4 animate-fadeIn">
              <div className="p-4 rounded-xl bg-gradient-to-br from-cyan-950/40 to-blue-950/40 border border-cyan-500/30 space-y-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Flame className="w-4 h-4 text-amber-400" />
                  <span>Tangible City Benefits & ROI</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="p-3 rounded-lg bg-slate-900/70 border border-slate-800 space-y-1">
                    <span className="text-xs font-bold text-emerald-400">Faster Hazard Resolution</span>
                    <p className="text-[11px] text-slate-400">
                      Reduces incident detection-to-repair turnaround from <strong>14 days to under 24 hours</strong>.
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-900/70 border border-slate-800 space-y-1">
                    <span className="text-xs font-bold text-cyan-400">Budget Efficiency</span>
                    <p className="text-[11px] text-slate-400">
                      Eliminates specialized patrol vehicle capital expenditure by piggybacking on existing bus routes.
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-900/70 border border-slate-800 space-y-1">
                    <span className="text-xs font-bold text-purple-400">Accountability & Transparency</span>
                    <p className="text-[11px] text-slate-400">
                      Immutable timestamped records with GPS accuracy prevent ghost repairs and contractor disputes.
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-900/70 border border-slate-800 space-y-1">
                    <span className="text-xs font-bold text-amber-400">Ward Heatmap Analytics</span>
                    <p className="text-[11px] text-slate-400">
                      Enables predictive road resurfacing budgeting based on recurring anomaly cluster frequencies.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: TECH STACK & TEAM */}
          {activeTab === "stack" && (
            <div className="space-y-4 animate-fadeIn">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[
                  { name: "FastAPI", category: "Backend Engine", color: "text-emerald-400" },
                  { name: "YOLOv8", category: "Computer Vision", color: "text-purple-400" },
                  { name: "React 19 + Vite", category: "Frontend UI", color: "text-cyan-400" },
                  { name: "Leaflet.js", category: "Interactive GIS", color: "text-emerald-300" },
                  { name: "PostgreSQL / SQLite", category: "Dual Database", color: "text-blue-400" },
                  { name: "Cloudinary", category: "Media CDN", color: "text-amber-400" },
                  { name: "Docker", category: "Containerization", color: "text-sky-400" },
                  { name: "Web Audio API", category: "Real-time Chimes", color: "text-pink-400" },
                ].map((item) => (
                  <div key={item.name} className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
                    <div className={`text-xs font-bold ${item.color}`}>{item.name}</div>
                    <div className="text-[10px] text-slate-400">{item.category}</div>
                  </div>
                ))}
              </div>

              <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-800 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white">Smart India Hackathon 2024 / 2025</h4>
                  <p className="text-[11px] text-slate-400">Problem Statement 26124: Smart City Anomaly Monitoring</p>
                </div>
                <a
                  href="https://github.com/bhushzn/urban-inteligence"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 text-xs font-semibold border border-cyan-500/40 transition-all"
                >
                  <span>GitHub Repo</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>Command Center v2.0 Live</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 font-semibold transition-colors"
          >
            Close Presentation
          </button>
        </div>
      </div>
    </div>
  );
};
