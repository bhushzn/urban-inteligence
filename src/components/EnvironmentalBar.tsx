import React, { useState, useEffect } from "react";
import {
  Wind,
  Thermometer,
  Volume2,
  Users,
  Car,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Activity,
  Info
} from "lucide-react";
import type { EnvironmentalTelemetry } from "../api";
import { DEFAULT_TELEMETRY, api } from "../api";

interface EnvironmentalBarProps {
  telemetry?: EnvironmentalTelemetry | null;
}

export const EnvironmentalBar: React.FC<EnvironmentalBarProps> = ({ telemetry: propTelemetry }) => {
  const [telemetry, setTelemetry] = useState<EnvironmentalTelemetry>(propTelemetry || DEFAULT_TELEMETRY);
  const [expanded, setExpanded] = useState<boolean>(false);

  useEffect(() => {
    if (propTelemetry) {
      setTelemetry(propTelemetry);
      return;
    }
    let isMounted = true;
    api.getEnvironmentalTelemetry().then((data) => {
      if (isMounted && data) setTelemetry(data);
    });
    const interval = setInterval(() => {
      api.getEnvironmentalTelemetry().then((data) => {
        if (isMounted && data) setTelemetry(data);
      });
    }, 15000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [propTelemetry]);

  const aqiColor =
    telemetry.aqi.value <= 50
      ? "text-emerald-400 bg-emerald-500/15 border-emerald-500/30"
      : telemetry.aqi.value <= 100
      ? "text-amber-400 bg-amber-500/15 border-amber-500/30"
      : "text-rose-400 bg-rose-500/15 border-rose-500/30";

  return (
    <div className="mx-4 mt-2 transition-all duration-300">
      <div className="glass rounded-xl px-4 py-2 border border-slate-700/50 flex flex-wrap items-center justify-between gap-3 text-xs shadow-lg">
        
        {/* Left Indicator: Roving Multi-Sensor Network */}
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="font-display font-semibold text-slate-200 tracking-wide flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Fleet Telemetry Grid</span>
            <span className="text-[10px] font-mono text-cyan-400/90 bg-cyan-950/40 px-1.5 py-0.5 rounded border border-cyan-700/40">
              {telemetry.active_fleet_sensors} Buses Active
            </span>
          </span>
        </div>

        {/* Center: Live Multi-Sensor Metric Chips */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          
          {/* Air Quality (AQI) */}
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-mono font-medium ${aqiColor}`}>
            <Wind className="w-3.5 h-3.5 shrink-0" />
            <span className="text-[11px]">AQI {telemetry.aqi.value}</span>
            <span className="hidden md:inline text-[10px] uppercase font-bold opacity-85">({telemetry.aqi.category})</span>
          </div>

          {/* Temperature */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/60 border border-slate-700/60 text-slate-200 font-mono">
            <Thermometer className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="text-[11px]">{telemetry.temperature.value}{telemetry.temperature.unit}</span>
            <span className="hidden lg:inline text-[10px] text-slate-400">({telemetry.temperature.humidity_pct}% RH)</span>
          </div>

          {/* Acoustic Noise */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/60 border border-slate-700/60 text-slate-200 font-mono">
            <Volume2 className="w-3.5 h-3.5 text-purple-400 shrink-0" />
            <span className="text-[11px]">{telemetry.noise.value} {telemetry.noise.unit}</span>
            <span className="hidden lg:inline text-[10px] text-slate-400">({telemetry.noise.status})</span>
          </div>

          {/* Crowd Density */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/60 border border-slate-700/60 text-slate-200 font-mono">
            <Users className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span className="text-[11px]">Crowd: {telemetry.crowd_density.avg_bus_load_pct}%</span>
          </div>

          {/* Traffic Congestion Index */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/60 border border-slate-700/60 text-slate-200 font-mono">
            <Car className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span className="text-[11px]">Traffic: {telemetry.traffic_congestion.avg_speed_kmh} km/h</span>
          </div>

          {/* Bus Lane Enforcement */}
          <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/60 border border-slate-700/60 text-slate-200 font-mono">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="text-[11px]">Bus Lane: {telemetry.bus_lane_enforcement.compliance_pct}%</span>
          </div>
        </div>

        {/* Right Details Toggle */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-cyan-300 transition-colors shrink-0"
        >
          <span>{expanded ? "Hide Matrix" : "Sensor Matrix"}</span>
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Expanded Multi-Sensor Matrix Drawer (Slides 2 & 3 in PPT) */}
      {expanded && (
        <div className="glass rounded-xl p-4 mt-2 border border-slate-700/60 bg-slate-900/90 shadow-2xl animate-fadeIn">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-cyan-400" />
              <h3 className="font-display font-bold text-white text-xs tracking-wide">
                Transit Fleet Mobile Sensor Matrix — Slide 2 & 3 Specification
              </h3>
            </div>
            <span className="text-[10px] font-mono text-slate-400">
              Stationary + Roving Calibration: 99.4% Synchronized
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3">
            
            {/* AQI Breakdown */}
            <div className="p-3 rounded-lg bg-slate-800/40 border border-slate-700/50 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Wind className="w-3.5 h-3.5 text-emerald-400" /> Air Quality (AQI)
                </span>
                <span className="text-xs font-bold text-amber-400 font-mono">{telemetry.aqi.value}</span>
              </div>
              <div className="text-[10px] text-slate-400 space-y-0.5 font-mono">
                <div>PM2.5: <strong className="text-white">{telemetry.aqi.pm25} µg/m³</strong></div>
                <div>PM10: <strong className="text-white">{telemetry.aqi.pm10} µg/m³</strong></div>
                <div>CO: <strong className="text-white">{telemetry.aqi.co} mg/m³</strong></div>
              </div>
            </div>

            {/* Acoustic Noise */}
            <div className="p-3 rounded-lg bg-slate-800/40 border border-slate-700/50 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Volume2 className="w-3.5 h-3.5 text-purple-400" /> Acoustic Sensor
                </span>
                <span className="text-xs font-bold text-purple-300 font-mono">{telemetry.noise.value} dB</span>
              </div>
              <div className="text-[10px] text-slate-400 space-y-0.5">
                <div>Ambient: <strong className="text-white font-mono">{telemetry.noise.status}</strong></div>
                <div>Peak Chokepoint: <strong className="text-slate-200">{telemetry.noise.peak_zone}</strong></div>
                <div>Peak Recorded: <strong className="text-amber-400 font-mono">{telemetry.noise.peak_value} dB</strong></div>
              </div>
            </div>

            {/* Traffic & Chokepoints */}
            <div className="p-3 rounded-lg bg-slate-800/40 border border-slate-700/50 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Car className="w-3.5 h-3.5 text-cyan-400" /> Traffic Congestion
                </span>
                <span className="text-xs font-bold text-cyan-300 font-mono">{telemetry.traffic_congestion.status}</span>
              </div>
              <div className="text-[10px] text-slate-400 space-y-0.5">
                <div>Avg Transit Speed: <strong className="text-white font-mono">{telemetry.traffic_congestion.avg_speed_kmh} km/h</strong></div>
                <div>Delay Multiplier: <strong className="text-amber-400 font-mono">{telemetry.traffic_congestion.congestion_index}</strong></div>
                <div>Chokepoint: <strong className="text-slate-200">{telemetry.traffic_congestion.active_chokepoints[0]}</strong></div>
              </div>
            </div>

            {/* Bus Lane & Compliance */}
            <div className="p-3 rounded-lg bg-slate-800/40 border border-slate-700/50 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Bus Lane Enforcement
                </span>
                <span className="text-xs font-bold text-emerald-400 font-mono">{telemetry.bus_lane_enforcement.compliance_pct}%</span>
              </div>
              <div className="text-[10px] text-slate-400 space-y-0.5">
                <div>Obstructions Flagged: <strong className="text-rose-400 font-mono">{telemetry.bus_lane_enforcement.active_obstructions} Active</strong></div>
                <div>Cleared by Police: <strong className="text-emerald-300 font-mono">{telemetry.bus_lane_enforcement.cleared_today} Today</strong></div>
                <div>Lane Health: <strong className="text-white font-mono">{telemetry.bus_lane_enforcement.status}</strong></div>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
