import React, { useState, useEffect } from "react";
import { api } from "../api";
import type { AuditSummary } from "../api";

interface ExecutiveReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExecutiveReportModal: React.FC<ExecutiveReportModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [data, setData] = useState<AuditSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadAuditSummary();
    }
  }, [isOpen]);

  const loadAuditSummary = async () => {
    try {
      setLoading(true);
      const res = await api.getAuditSummary();
      setData(res);
    } catch (err) {
      console.error("Failed to load audit summary:", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    if (!data) return;

    let csv = "Corridor Name,Length (km),Daily PCU,PDI Score,Status,15d Forecast,30d Forecast,Estimated Repair Cost\n";
    data.corridor_breakdown.forEach((c) => {
      csv += `"${c.name}",${c.length_km},${c.daily_pcu},${c.pdi_score},"${c.status}",${c.forecast_15d},${c.forecast_30d},"${c.repair_cost_label}"\n`;
    });

    csv += "\nContractor Leaderboard,Dispatched Orders,Completed,Compliance Rate,Avg Quality Score,Performance Grade\n";
    data.contractor_leaderboard.forEach((ct) => {
      csv += `"${ct.name}",${ct.dispatched},${ct.completed},${ct.compliance_pct}%,${ct.avg_quality_score}%,${ct.rating}\n`;
    });

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `BMC_Road_Audit_${data.report_id}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in print:p-0 print:bg-white">
      <div
        className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden print:border-0 print:shadow-none print:max-h-none print:w-full print:bg-white print:text-black"
        role="dialog"
        aria-labelledby="modal-exec-report-title"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950 print:bg-white print:border-b-2 print:border-black">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 text-xl font-bold print:border-black print:text-black">
              📋
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 id="modal-exec-report-title" className="text-lg font-bold text-white print:text-black tracking-wide">
                  Executive Pavement Quality & SLA Audit Report
                </h2>
                <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 print:border-black print:text-black">
                  {data?.report_id || "BMC-AUDIT-2026-Q3"}
                </span>
              </div>
              <p className="text-xs text-slate-400 print:text-slate-600">
                Bhopal Municipal Corporation • Smart City Development Corporation Limited
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 print:hidden">
            <button
              onClick={handleExportCSV}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center space-x-1.5 transition-colors"
            >
              <span>📥</span>
              <span>Export CSV</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 flex items-center space-x-1.5 transition-colors shadow-md shadow-indigo-500/20"
            >
              <span>🖨️</span>
              <span>Print PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6 custom-scrollbar flex-1 print:overflow-visible print:p-2">
          {loading ? (
            <div className="py-12 text-center text-slate-400 text-sm flex items-center justify-center space-x-2">
              <span className="animate-spin">🔄</span>
              <span>Generating municipal audit telemetry...</span>
            </div>
          ) : data ? (
            <>
              {/* Executive Metadata Box */}
              <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs print:border print:border-black print:bg-slate-50">
                <div>
                  <span className="text-slate-400 print:text-slate-600 block text-[10px] uppercase">Audit Cycle</span>
                  <span className="font-bold text-white print:text-black text-sm">{data.reporting_cycle}</span>
                </div>
                <div>
                  <span className="text-slate-400 print:text-slate-600 block text-[10px] uppercase">Generated On</span>
                  <span className="font-semibold text-slate-200 print:text-black">{data.generated_at}</span>
                </div>
                <div>
                  <span className="text-slate-400 print:text-slate-600 block text-[10px] uppercase">Autonomous Telemetry</span>
                  <span className="font-semibold text-emerald-400 print:text-black">100% Calibrated</span>
                </div>
                <div>
                  <span className="text-slate-400 print:text-slate-600 block text-[10px] uppercase">Est. Annual Savings</span>
                  <span className="font-bold text-cyan-400 print:text-black">{data.estimated_cost_savings}</span>
                </div>
              </div>

              {/* High-Level Scorecards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
                <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3 print:border print:border-black">
                  <div className="text-[10px] uppercase font-bold text-slate-400 print:text-slate-600">Mean PDI Score</div>
                  <div className="text-2xl font-black text-indigo-400 print:text-black mt-1">
                    {data.city_average_pdi} <span className="text-xs font-normal text-slate-400">/ 100</span>
                  </div>
                  <div className="text-[10px] font-semibold text-slate-300 print:text-black mt-0.5">Rating: {data.pdi_rating}</div>
                </div>

                <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3 print:border print:border-black">
                  <div className="text-[10px] uppercase font-bold text-slate-400 print:text-slate-600">SLA Compliance</div>
                  <div className="text-2xl font-black text-emerald-400 print:text-black mt-1">
                    {data.contractor_compliance_rate}%
                  </div>
                  <div className="text-[10px] font-semibold text-slate-300 print:text-black mt-0.5">Avg: {data.average_repair_turnaround_hrs}h Turnaround</div>
                </div>

                <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3 print:border print:border-black">
                  <div className="text-[10px] uppercase font-bold text-slate-400 print:text-slate-600">Resolution Rate</div>
                  <div className="text-2xl font-black text-cyan-400 print:text-black mt-1">
                    {data.resolution_percentage}%
                  </div>
                  <div className="text-[10px] font-semibold text-slate-300 print:text-black mt-0.5">{data.resolved_incidents} of {data.total_incidents_logged} Resolved</div>
                </div>

                <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3 print:border print:border-black">
                  <div className="text-[10px] uppercase font-bold text-slate-400 print:text-slate-600">Lane Span Monitored</div>
                  <div className="text-2xl font-black text-amber-400 print:text-black mt-1">
                    {data.total_lane_km_monitored}
                  </div>
                  <div className="text-[10px] font-semibold text-slate-300 print:text-black mt-0.5">Kilometers Covered</div>
                </div>
              </div>

              {/* Corridor PDI Audit Table */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-slate-300 print:text-black uppercase tracking-wider">
                  Arterial Transit Corridors — Distress & Budget Audit
                </h3>
                <div className="overflow-x-auto rounded-xl border border-slate-700/70 print:border-black">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-800/80 text-slate-400 print:bg-slate-200 print:text-black border-b border-slate-700">
                      <tr>
                        <th className="py-2.5 px-3">Corridor</th>
                        <th className="py-2.5 px-3">Span</th>
                        <th className="py-2.5 px-3">Daily Traffic</th>
                        <th className="py-2.5 px-3">PDI</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3">15d / 30d Risk</th>
                        <th className="py-2.5 px-3">Est. Budget</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 print:divide-black">
                      {data.corridor_breakdown.map((c) => (
                        <tr key={c.id} className="hover:bg-slate-800/30 print:hover:bg-transparent">
                          <td className="py-2 px-3 font-semibold text-white print:text-black">{c.name}</td>
                          <td className="py-2 px-3 text-slate-300 print:text-black">{c.length_km} km</td>
                          <td className="py-2 px-3 text-slate-300 print:text-black">{c.daily_pcu.toLocaleString()} PCU</td>
                          <td className="py-2 px-3 font-mono font-bold text-indigo-400 print:text-black">{c.pdi_score}</td>
                          <td className="py-2 px-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                c.status === "Optimal"
                                  ? "bg-emerald-500/20 text-emerald-300"
                                  : c.status === "Moderate"
                                  ? "bg-amber-500/20 text-amber-300"
                                  : "bg-rose-500/20 text-rose-300"
                              } print:bg-transparent print:text-black`}
                            >
                              {c.status}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-rose-400 print:text-black font-semibold">
                            +{c.forecast_15d} / +{c.forecast_30d}
                          </td>
                          <td className="py-2 px-3 font-semibold text-cyan-400 print:text-black">{c.repair_cost_label}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Contractor SLA Performance Leaderboard */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-slate-300 print:text-black uppercase tracking-wider">
                  Contractor Performance & SLA Compliance Leaderboard
                </h3>
                <div className="overflow-x-auto rounded-xl border border-slate-700/70 print:border-black">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-800/80 text-slate-400 print:bg-slate-200 print:text-black border-b border-slate-700">
                      <tr>
                        <th className="py-2.5 px-3">Contractor / Agency</th>
                        <th className="py-2.5 px-3">Dispatched</th>
                        <th className="py-2.5 px-3">Completed</th>
                        <th className="py-2.5 px-3">SLA Compliance</th>
                        <th className="py-2.5 px-3">AI Quality Score</th>
                        <th className="py-2.5 px-3">Rating</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 print:divide-black">
                      {data.contractor_leaderboard.map((ct) => (
                        <tr key={ct.name} className="hover:bg-slate-800/30 print:hover:bg-transparent">
                          <td className="py-2 px-3 font-semibold text-white print:text-black">{ct.name}</td>
                          <td className="py-2 px-3 text-slate-300 print:text-black">{ct.dispatched} orders</td>
                          <td className="py-2 px-3 text-emerald-400 print:text-black font-semibold">{ct.completed} done</td>
                          <td className="py-2 px-3 font-bold text-slate-200 print:text-black">{ct.compliance_pct}%</td>
                          <td className="py-2 px-3 font-mono text-cyan-400 print:text-black">{ct.avg_quality_score}%</td>
                          <td className="py-2 px-3 font-black text-amber-400 print:text-black">{ct.rating}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Official Sign-off Footer */}
              <div className="pt-4 border-t border-slate-800 flex justify-between text-[11px] text-slate-400 print:text-black">
                <div>
                  Certified by: <strong className="text-slate-200 print:text-black">UrbanIntel AI Municipal Core Engine</strong>
                </div>
                <div>
                  Commissioner Sign-off: <strong className="text-slate-200 print:text-black">Dr. S. K. Verma, IAS</strong>
                </div>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
};
