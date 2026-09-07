import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { api } from "../api";
import type { CorridorAnalyticsResponse } from "../api";

interface CorridorAnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCorridor?: (coords: [number, number]) => void;
}

export const CorridorAnalyticsModal: React.FC<CorridorAnalyticsModalProps> = ({
  isOpen,
  onClose,
  onSelectCorridor,
}) => {
  const [data, setData] = useState<CorridorAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [monsoonMultiplier, setMonsoonMultiplier] = useState(1.0); // 1.0 = Normal, up to 2.5 = Extreme Monsoons
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await api.getCorridorAnalytics();
      setData(res);
    } catch (err) {
      console.error("Failed to fetch corridor analytics:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Compute simulated adjusted values based on monsoon stress factor
  const getAdjustedPDI = (basePdi: number) => {
    const penalty = (monsoonMultiplier - 1.0) * 18.0;
    return Math.max(15, Math.min(99, Math.round((basePdi - penalty) * 10) / 10));
  };

  const getAdjustedCost = (baseCost: number) => {
    return Math.round(baseCost * (1 + (monsoonMultiplier - 1.0) * 0.45));
  };

  const getAdjustedForecast = (base15d: number) => {
    return Math.round(base15d * monsoonMultiplier);
  };

  const corridors = data?.corridors || [];
  const filteredCorridors = corridors.filter((c) => {
    if (filterStatus === "all") return true;
    const adjPdi = getAdjustedPDI(c.pdi_score);
    if (filterStatus === "Critical") return adjPdi < 55;
    if (filterStatus === "Moderate") return adjPdi >= 55 && adjPdi < 80;
    if (filterStatus === "Optimal") return adjPdi >= 80;
    return true;
  });

  const avgSimulatedPdi = corridors.length
    ? Math.round(
        (corridors.reduce((acc, c) => acc + getAdjustedPDI(c.pdi_score), 0) /
          corridors.length) *
          10
      ) / 10
    : 0;

  const totalSimulatedBudget = corridors.reduce(
    (acc, c) => acc + getAdjustedCost(c.repair_cost_inr),
    0
  );

  return createPortal(
    <div
      className="fixed inset-0 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in"
      style={{ zIndex: 999999 }}
    >
      <div
        className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
        role="dialog"
        aria-labelledby="modal-pdi-title"
      >
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-900 via-indigo-950/30 to-slate-900">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 text-xl font-bold">
              📊
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 id="modal-pdi-title" className="text-xl font-bold text-white tracking-wide">
                  Transit Corridor PDI & Predictive Deterioration AI
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  SIH 26124 AI Engine
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Pavement Distress Index (PDI 0–100), monsoon stress simulation, and 30-day wear forecasts across Bhopal's arterial transit corridors.
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={loadData}
              disabled={loading}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center space-x-1.5 transition-colors"
              title="Refresh telemetry"
            >
              <span className={loading ? "animate-spin" : ""}>🔄</span>
              <span>Sync</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 custom-scrollbar flex-1">
          {/* Top KPI Metrics Bar */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4">
              <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">Citywide Mean PDI</div>
              <div className="flex items-baseline space-x-2 mt-1">
                <span
                  className={`text-3xl font-extrabold ${
                    avgSimulatedPdi >= 80
                      ? "text-emerald-400"
                      : avgSimulatedPdi >= 55
                      ? "text-amber-400"
                      : "text-rose-400"
                  }`}
                >
                  {avgSimulatedPdi}
                </span>
                <span className="text-xs text-slate-400">/ 100</span>
              </div>
              <div className="text-xs text-slate-400 mt-1">
                Status:{" "}
                <span
                  className={`font-semibold ${
                    avgSimulatedPdi >= 80
                      ? "text-emerald-400"
                      : avgSimulatedPdi >= 55
                      ? "text-amber-400"
                      : "text-rose-400"
                  }`}
                >
                  {avgSimulatedPdi >= 80 ? "Optimal" : avgSimulatedPdi >= 55 ? "Moderate Wear" : "Critical Repair"}
                </span>
              </div>
            </div>

            <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4">
              <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">Monitored Lane Span</div>
              <div className="flex items-baseline space-x-2 mt-1">
                <span className="text-3xl font-extrabold text-indigo-400">
                  {data?.total_lane_km || 115.2}
                </span>
                <span className="text-xs text-slate-400">Lane km</span>
              </div>
              <div className="text-xs text-slate-400 mt-1">
                Across 5 Major Arterial Corridors
              </div>
            </div>

            <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4">
              <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">Estimated Patch Budget</div>
              <div className="flex items-baseline space-x-2 mt-1">
                <span className="text-3xl font-extrabold text-cyan-400">
                  ₹ {(totalSimulatedBudget / 100000).toFixed(1)}
                </span>
                <span className="text-xs text-slate-400">Lakhs</span>
              </div>
              <div className="text-xs text-slate-400 mt-1">
                DBM & Cold Mix Asphalt Resurfacing
              </div>
            </div>

            <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4">
              <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">Preventive Savings ROI</div>
              <div className="flex items-baseline space-x-2 mt-1">
                <span className="text-3xl font-extrabold text-emerald-400">
                  4.8x
                </span>
                <span className="text-xs text-slate-400">Cost Factor</span>
              </div>
              <div className="text-xs text-slate-400 mt-1">
                Over Reactive Deep Subgrade Reconstruction
              </div>
            </div>
          </div>

          {/* Interactive Monsoon Stress Simulator */}
          <div className="bg-gradient-to-r from-blue-950/40 via-slate-900 to-indigo-950/40 border border-blue-800/40 rounded-xl p-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="text-base">🌧️</span>
                  <h3 className="text-sm font-bold text-white">
                    Simulate Monsoon Rainfall & Heavy Transit Stress
                  </h3>
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    Predictive Stress Test
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Slide to simulate torrential rainfall saturation and water ingress acceleration on asphalt cracking.
                </p>
              </div>
              <div className="flex items-center space-x-4 min-w-[280px]">
                <input
                  type="range"
                  min="1.0"
                  max="2.5"
                  step="0.1"
                  value={monsoonMultiplier}
                  onChange={(e) => setMonsoonMultiplier(parseFloat(e.target.value))}
                  className="w-full accent-blue-500 cursor-pointer"
                />
                <span className="text-xs font-bold text-blue-400 whitespace-nowrap px-2 py-1 bg-blue-900/40 rounded border border-blue-700/50">
                  {monsoonMultiplier === 1.0
                    ? "Dry Season (1.0x)"
                    : monsoonMultiplier < 1.8
                    ? `Moderate Rain (${monsoonMultiplier}x)`
                    : `Monsoon Deluge (${monsoonMultiplier}x)`}
                </span>
              </div>
            </div>
          </div>

          {/* Corridor Filter Tabs */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-400 font-medium">Filter Corridors:</span>
              {(["all", "Critical", "Moderate", "Optimal"] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                    filterStatus === status
                      ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
                      : "bg-slate-800/80 text-slate-400 hover:text-slate-200 border border-slate-700/60"
                  }`}
                >
                  {status === "all" ? "All Corridors (5)" : status}
                </button>
              ))}
            </div>
            <span className="text-xs text-slate-400">
              Showing {filteredCorridors.length} of {corridors.length} corridors
            </span>
          </div>

          {/* Corridor Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredCorridors.map((corridor) => {
              const simPdi = getAdjustedPDI(corridor.pdi_score);
              const simCost = getAdjustedCost(corridor.repair_cost_inr);
              const simForecast15d = getAdjustedForecast(corridor.forecast_15d);
              const simForecast30d = getAdjustedForecast(corridor.forecast_30d);

              const statusBadgeClass =
                simPdi >= 80
                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                  : simPdi >= 55
                  ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                  : "bg-rose-500/20 text-rose-300 border-rose-500/40";

              return (
                <div
                  key={corridor.id}
                  className="bg-slate-800/50 border border-slate-700/70 rounded-xl p-4 hover:border-indigo-500/50 transition-all flex flex-col justify-between group"
                >
                  <div className="space-y-3">
                    {/* Card Title & Status Badge */}
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-bold text-white text-sm group-hover:text-indigo-300 transition-colors">
                          {corridor.name}
                        </h4>
                        <div className="flex items-center space-x-2 text-[11px] text-slate-400 mt-0.5">
                          <span>🛣️ {corridor.length_km} km</span>
                          <span>•</span>
                          <span>🚗 {corridor.daily_pcu.toLocaleString()} PCU/day</span>
                          <span>•</span>
                          <span>🏢 {corridor.jurisdiction}</span>
                        </div>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${statusBadgeClass}`}>
                        PDI {simPdi}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] text-slate-400">
                        <span>Pavement Distress Index</span>
                        <span className="font-bold text-slate-200">
                          {simPdi >= 80 ? "Optimal (Minor Wear)" : simPdi >= 55 ? "Moderate Deterioration" : "Critical Breakdown"}
                        </span>
                      </div>
                      <div className="h-2 w-full bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 rounded-full ${
                            simPdi >= 80
                              ? "bg-emerald-500"
                              : simPdi >= 55
                              ? "bg-amber-500"
                              : "bg-rose-500"
                          }`}
                          style={{ width: `${simPdi}%` }}
                        />
                      </div>
                    </div>

                    {/* Corridor Specific Details */}
                    <div className="grid grid-cols-2 gap-2 text-xs bg-slate-900/60 rounded-lg p-2.5 border border-slate-800">
                      <div>
                        <div className="text-[10px] text-slate-400 uppercase">Surface Type</div>
                        <div className="font-medium text-slate-200 truncate">{corridor.surface_type}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400 uppercase">Primary Hazard</div>
                        <div className="font-medium text-slate-200 truncate">{corridor.dominant_damage}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400 uppercase">15d / 30d Forecast</div>
                        <div className="font-semibold text-rose-400">
                          +{simForecast15d} / +{simForecast30d} Potholes
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400 uppercase">Est. Resurfacing Cost</div>
                        <div className="font-semibold text-cyan-400">
                          ₹ {(simCost / 100000).toFixed(1)} Lakhs
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Bar */}
                  <div className="mt-3 pt-3 border-t border-slate-700/60 flex items-center justify-between">
                    <div className="flex items-center space-x-1.5">
                      <span className="text-[10px] text-slate-400">Wards:</span>
                      {corridor.wards.map((w) => (
                        <span key={w} className="px-1.5 py-0.5 rounded text-[10px] bg-slate-700 text-slate-300 font-mono">
                          {w}
                        </span>
                      ))}
                    </div>

                    {onSelectCorridor && (
                      <button
                        onClick={() => {
                          onSelectCorridor([corridor.lat, corridor.lng]);
                          onClose();
                        }}
                        className="px-2.5 py-1 rounded-lg text-xs font-medium text-indigo-400 hover:text-white hover:bg-indigo-600/30 border border-indigo-500/30 transition-all flex items-center space-x-1"
                      >
                        <span>📍 Focus on Map</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center space-x-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Telemetry calibrated via Municipal BRTS Fleet & AI Edge Dashcam Sensors</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium transition-colors"
          >
            Close Dashboard
          </button>
        </div>
      </div>
    </div>,
    document.getElementById("modal-root") || document.body
  );
};
