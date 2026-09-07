import React, { useState } from "react";
import { createPortal } from "react-dom";
import { api } from "../api";
import type { SafeRouteResponse } from "../api";

interface SafeRouteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyRouteToMap?: (route: SafeRouteResponse) => void;
}

const HUBS = [
  "AIIMS Hospital Bhopal",
  "Hamidia Medical College",
  "MP Nagar Commercial Hub",
  "Bhopal Junction Railway",
  "Kolar Road Residential Corridor",
  "Bairagarh Transit Gateway",
  "Roshanpura Square"
];

export const SafeRouteModal: React.FC<SafeRouteModalProps> = ({
  isOpen,
  onClose,
  onApplyRouteToMap,
}) => {
  const [origin, setOrigin] = useState<string>("AIIMS Hospital Bhopal");
  const [destination, setDestination] = useState<string>("MP Nagar Commercial Hub");
  const [vehicleType, setVehicleType] = useState<string>("ambulance");
  const [loading, setLoading] = useState<boolean>(false);
  const [routeResult, setRouteResult] = useState<SafeRouteResponse | null>(null);
  const [selectedPath, setSelectedPath] = useState<"safest" | "fastest">("safest");

  const handleComputeRoute = async () => {
    try {
      setLoading(true);
      const res = await api.calculateSafeRoute(origin, destination, vehicleType);
      setRouteResult(res);
    } catch (err) {
      console.error("Failed to compute safe route:", err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (isOpen) {
      handleComputeRoute();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in"
      style={{ zIndex: 999999 }}
    >
      <div
        className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
        role="dialog"
        aria-labelledby="modal-safe-route-title"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-900 via-blue-950/30 to-slate-900">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400 text-xl font-bold">
              🧭
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 id="modal-safe-route-title" className="text-lg font-bold text-white tracking-wide">
                  Safe-Route Hazard-Aware Navigation Engine
                </h2>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  Ambulance & Commuter AI Routing
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Calculates real-time anomaly-avoiding bypass paths to prevent vehicle damage & jarring patient transit.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6 custom-scrollbar flex-1">
          {/* Controls Bar: Origin, Destination, Vehicle Type */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-800/40 border border-slate-700/60 rounded-xl p-4">
            <div>
              <label className="text-[11px] uppercase font-bold text-slate-400 block mb-1.5">
                Origin (Start Hub)
              </label>
              <select
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              >
                {HUBS.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] uppercase font-bold text-slate-400 block mb-1.5">
                Destination (Arrival Hub)
              </label>
              <select
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              >
                {HUBS.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] uppercase font-bold text-slate-400 block mb-1.5">
                Vehicle Priority Profile
              </label>
              <div className="grid grid-cols-3 gap-1 bg-slate-900 p-1 rounded-lg border border-slate-700">
                {[
                  { id: "ambulance", label: "🚑 Ambulance" },
                  { id: "two_wheeler", label: "🏍️ 2-Wheeler" },
                  { id: "commuter", label: "🚗 Commuter" }
                ].map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setVehicleType(v.id)}
                    className={`py-1.5 text-[10px] font-bold rounded transition-all ${
                      vehicleType === v.id
                        ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {v.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleComputeRoute}
              disabled={loading}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-all shadow-lg shadow-blue-600/30 flex items-center space-x-1.5 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <span className="animate-spin">🔄</span>
                  <span>Calculating Safe Paths...</span>
                </>
              ) : (
                <>
                  <span>⚡</span>
                  <span>Recalculate Hazard-Avoidance Routes</span>
                </>
              )}
            </button>
          </div>

          {/* Route Comparison Cards */}
          {routeResult && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Safest Route (Recommended) */}
                <div
                  onClick={() => setSelectedPath("safest")}
                  className={`border rounded-xl p-4 cursor-pointer transition-all ${
                    selectedPath === "safest"
                      ? "bg-emerald-950/30 border-emerald-500/80 shadow-lg shadow-emerald-500/10 ring-2 ring-emerald-500/30"
                      : "bg-slate-800/40 border-slate-700/60 hover:border-slate-600"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 uppercase">
                          AI RECOMMENDED
                        </span>
                        <span className="text-xs font-bold text-emerald-400">
                          {routeResult.safest_route.smoothness_score}% Smoothness
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-white mt-1">
                        {routeResult.safest_route.name}
                      </h3>
                    </div>
                    <span className="text-lg">🛡️</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 my-3 text-center">
                    <div className="bg-slate-900/60 rounded-lg p-2 border border-slate-800">
                      <div className="text-[10px] text-slate-400 uppercase">Distance</div>
                      <div className="text-sm font-bold text-white">{routeResult.safest_route.distance_km} km</div>
                    </div>
                    <div className="bg-slate-900/60 rounded-lg p-2 border border-slate-800">
                      <div className="text-[10px] text-slate-400 uppercase">Duration</div>
                      <div className="text-sm font-bold text-white">{routeResult.safest_route.duration_minutes} mins</div>
                    </div>
                    <div className="bg-slate-900/60 rounded-lg p-2 border border-slate-800">
                      <div className="text-[10px] text-slate-400 uppercase">Hazards</div>
                      <div className="text-sm font-bold text-emerald-400">0 Critical</div>
                    </div>
                  </div>

                  <p className="text-xs text-emerald-300/90 bg-emerald-950/40 p-2.5 rounded-lg border border-emerald-900/40 leading-relaxed">
                    {routeResult.safest_route.recommendation}
                  </p>
                </div>

                {/* Fastest Route (Direct with hazards) */}
                <div
                  onClick={() => setSelectedPath("fastest")}
                  className={`border rounded-xl p-4 cursor-pointer transition-all ${
                    selectedPath === "fastest"
                      ? "bg-rose-950/30 border-rose-500/80 shadow-lg shadow-rose-500/10 ring-2 ring-rose-500/30"
                      : "bg-slate-800/40 border-slate-700/60 hover:border-slate-600"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 uppercase">
                          HIGH HAZARD RISK
                        </span>
                        <span className="text-xs font-bold text-rose-400">
                          {routeResult.fastest_route.risk_score}% Damage Risk
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-white mt-1">
                        {routeResult.fastest_route.name}
                      </h3>
                    </div>
                    <span className="text-lg">⚠️</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 my-3 text-center">
                    <div className="bg-slate-900/60 rounded-lg p-2 border border-slate-800">
                      <div className="text-[10px] text-slate-400 uppercase">Distance</div>
                      <div className="text-sm font-bold text-white">{routeResult.fastest_route.distance_km} km</div>
                    </div>
                    <div className="bg-slate-900/60 rounded-lg p-2 border border-slate-800">
                      <div className="text-[10px] text-slate-400 uppercase">Duration</div>
                      <div className="text-sm font-bold text-white">{routeResult.fastest_route.duration_minutes} mins</div>
                    </div>
                    <div className="bg-slate-900/60 rounded-lg p-2 border border-slate-800">
                      <div className="text-[10px] text-slate-400 uppercase">Hazards</div>
                      <div className="text-sm font-bold text-rose-400">
                        {routeResult.fastest_route.hazards_encountered} Active
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-rose-300/90 bg-rose-950/40 p-2.5 rounded-lg border border-rose-900/40 leading-relaxed">
                    {routeResult.fastest_route.warning}
                  </p>
                </div>
              </div>

              {/* Turn-by-turn guidance */}
              <div className="bg-slate-800/30 border border-slate-700/60 rounded-xl p-4 space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Turn Guidance & Corridor Instructions ({selectedPath === "safest" ? "Safe Bypass" : "Direct Arterial"})
                </h4>
                <div className="space-y-1.5">
                  {routeResult.turn_guidance.map((step) => (
                    <div key={step.step} className="flex items-center justify-between text-xs py-1 px-2 rounded bg-slate-900/50">
                      <div className="flex items-center space-x-2">
                        <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-[10px]">
                          {step.step}
                        </span>
                        <span className="text-slate-200">{step.instruction}</span>
                      </div>
                      <span className="font-mono text-slate-400 text-[11px]">{step.dist}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            Navigation calibrated via Bhopal Smart City GIS & live telemetry
          </span>
          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
            >
              Close
            </button>
            {routeResult && onApplyRouteToMap && (
              <button
                onClick={() => {
                  onApplyRouteToMap(routeResult);
                  onClose();
                }}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-lg shadow-emerald-600/30 flex items-center space-x-1.5"
              >
                <span>🗺️</span>
                <span>Render Route on Main GIS Map</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.getElementById("modal-root") || document.body
  );
};
