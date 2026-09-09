import { useState, useEffect } from "react";
import {
  Wind,
  Thermometer,
  Volume2,
  Users,
  Car,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Sliders
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

  const aqiBadge =
    telemetry.aqi.value <= 50
      ? "badge-success"
      : telemetry.aqi.value <= 100
      ? "badge-warning"
      : "badge-critical";

  return (
    <div className="bg-[#0b101c] border-b border-white/5 px-4 lg:px-6 py-2 transition-colors">
      <div className="flex items-center justify-between gap-3 text-xs overflow-x-auto no-scrollbar">
        {/* Left Indicator: Roving Multi-Sensor Network */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-[11px]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold">TELEMETRY GRID</span>
          </div>
          <span className="font-mono text-[11px] text-slate-400 hidden sm:inline">
            <strong className="text-slate-200">{telemetry.active_fleet_sensors}</strong> Units Synced (101, 202, 303, 404)
          </span>
        </div>

        {/* Center: Live Multi-Sensor Metric Chips */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Air Quality (AQI) */}
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded border font-mono font-medium text-[11px] ${aqiBadge}`}>
            <Wind className="w-3.5 h-3.5 shrink-0" />
            <span>AQI {telemetry.aqi.value}</span>
            <span className="text-[10px] uppercase font-bold opacity-80">({telemetry.aqi.category})</span>
          </div>

          {/* Temperature & Humidity */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-white/[0.03] border border-white/5 text-slate-300 font-mono text-[11px]">
            <Thermometer className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>{telemetry.temperature.value}{telemetry.temperature.unit}</span>
            <span className="text-slate-400 text-[10px]">/ {telemetry.temperature.humidity_pct}% RH</span>
          </div>

          {/* Acoustic Noise */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-white/[0.03] border border-white/5 text-slate-300 font-mono text-[11px]">
            <Volume2 className="w-3.5 h-3.5 text-purple-400 shrink-0" />
            <span>{telemetry.noise.value} dB</span>
            <span className="text-slate-400 text-[10px] hidden md:inline">({telemetry.noise.status})</span>
          </div>

          {/* Commuter Load / Crowd Density */}
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded bg-white/[0.03] border border-white/5 text-slate-300 font-mono text-[11px]">
            <Users className="w-3.5 h-3.5 text-sky-400 shrink-0" />
            <span>Load: {telemetry.crowd_density.avg_bus_load_pct}%</span>
          </div>

          {/* Traffic Congestion Speed */}
          <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded bg-white/[0.03] border border-white/5 text-slate-300 font-mono text-[11px]">
            <Car className="w-3.5 h-3.5 text-sky-400 shrink-0" />
            <span>Transit: {telemetry.traffic_congestion.avg_speed_kmh} km/h</span>
          </div>

          {/* Bus Lane Compliance */}
          <div className="hidden 2xl:flex items-center gap-1.5 px-2.5 py-1 rounded bg-white/[0.03] border border-white/5 text-slate-300 font-mono text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>BRTS: {telemetry.bus_lane_enforcement.compliance_pct}%</span>
          </div>
        </div>

        {/* Right Details Toggle */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-white/5 text-[11px] text-slate-400 hover:text-sky-300 font-medium transition-colors shrink-0"
        >
          <Sliders className="w-3 h-3 text-sky-400" />
          <span>{expanded ? "Close Diagnostics" : "Sensor Diagnostics"}</span>
          {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      </div>

      {/* Expanded Multi-Sensor Calibration Drawer */}
      {expanded && (
        <div className="mt-2.5 pt-3 pb-1 border-t border-white/5 animate-in fade-in duration-150">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {/* AQI Breakdown */}
            <div className="p-2.5 rounded bg-white/[0.02] border border-white/5 space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400 font-semibold flex items-center gap-1.5">
                  <Wind className="w-3.5 h-3.5 text-emerald-400" /> Particulate Matter
                </span>
                <span className="font-mono font-bold text-amber-400">{telemetry.aqi.value} AQI</span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono space-y-0.5">
                <div className="flex justify-between"><span>PM2.5:</span> <span className="text-slate-200">{telemetry.aqi.pm25} µg/m³</span></div>
                <div className="flex justify-between"><span>PM10:</span> <span className="text-slate-200">{telemetry.aqi.pm10} µg/m³</span></div>
                <div className="flex justify-between"><span>CO Level:</span> <span className="text-slate-200">{telemetry.aqi.co} mg/m³</span></div>
              </div>
            </div>

            {/* Acoustic Matrix */}
            <div className="p-2.5 rounded bg-white/[0.02] border border-white/5 space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400 font-semibold flex items-center gap-1.5">
                  <Volume2 className="w-3.5 h-3.5 text-purple-400" /> Acoustic Sensor
                </span>
                <span className="font-mono font-bold text-purple-300">{telemetry.noise.value} dB</span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono space-y-0.5">
                <div className="flex justify-between"><span>Ambient Status:</span> <span className="text-slate-200">{telemetry.noise.status}</span></div>
                <div className="flex justify-between"><span>Peak Zone:</span> <span className="text-slate-200 truncate">{telemetry.noise.peak_zone}</span></div>
                <div className="flex justify-between"><span>Peak Reading:</span> <span className="text-amber-400">{telemetry.noise.peak_value} dB</span></div>
              </div>
            </div>

            {/* Traffic & Chokepoints */}
            <div className="p-2.5 rounded bg-white/[0.02] border border-white/5 space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400 font-semibold flex items-center gap-1.5">
                  <Car className="w-3.5 h-3.5 text-sky-400" /> Traffic Flow
                </span>
                <span className="font-mono font-bold text-sky-300">{telemetry.traffic_congestion.avg_speed_kmh} km/h</span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono space-y-0.5">
                <div className="flex justify-between"><span>Flow Status:</span> <span className="text-slate-200">{telemetry.traffic_congestion.status}</span></div>
                <div className="flex justify-between"><span>Congestion Index:</span> <span className="text-amber-400">{telemetry.traffic_congestion.congestion_index}</span></div>
                <div className="flex justify-between"><span>Active Chokepoint:</span> <span className="text-slate-200 truncate">{telemetry.traffic_congestion.active_chokepoints[0]}</span></div>
              </div>
            </div>

            {/* Bus Lane Compliance */}
            <div className="p-2.5 rounded bg-white/[0.02] border border-white/5 space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400 font-semibold flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Lane Enforcement
                </span>
                <span className="font-mono font-bold text-emerald-400">{telemetry.bus_lane_enforcement.compliance_pct}%</span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono space-y-0.5">
                <div className="flex justify-between"><span>Active Encroachments:</span> <span className="text-rose-400">{telemetry.bus_lane_enforcement.active_obstructions} Active</span></div>
                <div className="flex justify-between"><span>Cleared Today:</span> <span className="text-emerald-300">{telemetry.bus_lane_enforcement.cleared_today} Cases</span></div>
                <div className="flex justify-between"><span>Sensor Calibration:</span> <span className="text-slate-200">99.4% Synchronized</span></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
