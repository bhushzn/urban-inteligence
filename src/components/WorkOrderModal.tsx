import React, { useState } from "react";
import { X, Send, Clock, MapPin, CheckCircle2 } from "lucide-react";
import type { Incident } from "../api";
import { api } from "../api";

interface Props {
  incident: Incident;
  isOpen: boolean;
  onClose: () => void;
  onDispatched: () => void;
}

const CONTRACTORS = [
  { name: "Bhopal PWD — Rapid Road Repair Unit", zone: "Zone 1 (New Bhopal)", icon: "🚜" },
  { name: "BMC Sanitation & Debris Disposal Fleet", zone: "Zone 2 (Old City)", icon: "🚛" },
  { name: "Bhopal Smart City Infrastructure Division", zone: "Zone 3 (Arera & MP Nagar)", icon: "🏗️" },
  { name: "Madhya Pradesh Urja Drainage & Grid Team", zone: "Zone 4 (Bairagarh & Kolar)", icon: "⚡" },
];

const SLA_OPTIONS = [
  { hours: 12, label: "12 Hours (Critical Emergency)", badge: "bg-red-500/20 text-red-400 border-red-500/40" },
  { hours: 24, label: "24 Hours (High Priority)", badge: "bg-amber-500/20 text-amber-400 border-amber-500/40" },
  { hours: 48, label: "48 Hours (Standard Repair)", badge: "bg-cyan-500/20 text-cyan-400 border-cyan-500/40" },
  { hours: 72, label: "72 Hours (Routine Civic Patch)", badge: "bg-slate-700/40 text-slate-300 border-slate-600/40" },
];

export const WorkOrderModal: React.FC<Props> = ({ incident, isOpen, onClose, onDispatched }) => {
  const [contractorIndex, setContractorIndex] = useState(0);
  const [slaHours, setSlaHours] = useState(incident.severity === "High" ? 12 : 24);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  if (!isOpen) return null;

  const handleDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const selected = CONTRACTORS[contractorIndex];
      await api.dispatchIncident(incident.id, {
        contractor_name: selected.name,
        zone: selected.zone,
        priority: incident.severity,
        sla_hours: slaHours,
        notes: notes || `Dispatched to ${selected.name} for ${incident.type} remediation.`,
      });
      setDone(true);
      setTimeout(() => {
        onDispatched();
        onClose();
      }, 1200);
    } catch (err: any) {
      alert(err.message || "Failed to dispatch contractor work order.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative glass glow-cyan rounded-2xl w-full max-w-lg overflow-hidden border border-cyan-500/30 p-6 fade-in-up">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-700/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <Send className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-display">Dispatch Repair Crew</h3>
              <p className="text-xs text-slate-400">Automated SLA Work Order • SIH PS 26124</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800/80 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {done ? (
          <div className="py-10 text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center mx-auto text-emerald-400">
              <CheckCircle2 className="w-8 h-8 animate-bounce" />
            </div>
            <h4 className="text-base font-bold text-white">Work Order Dispatched!</h4>
            <p className="text-xs text-slate-400">
              Contractor notified with SLA deadline. Incident timeline updated.
            </p>
          </div>
        ) : (
          <form onSubmit={handleDispatch} className="space-y-4 text-xs">
            {/* Incident Summary Card */}
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
              <div>
                <div className="font-bold text-white text-sm">{incident.type}</div>
                <div className="text-slate-400 flex items-center gap-1.5 mt-0.5">
                  <MapPin className="w-3 h-3 text-cyan-400" />
                  <span>{incident.location} ({incident.ward})</span>
                </div>
              </div>
              <span className={`px-2 py-1 rounded-md font-bold uppercase ${
                incident.severity === "High" ? "bg-red-500/20 text-red-400 border border-red-500/30" : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
              }`}>
                {incident.severity} Priority
              </span>
            </div>

            {/* Contractor Selection */}
            <div>
              <label className="text-slate-400 font-semibold uppercase tracking-wider block mb-1.5">
                Select Municipal Contractor / Department
              </label>
              <div className="space-y-2">
                {CONTRACTORS.map((c, i) => (
                  <label
                    key={c.name}
                    onClick={() => setContractorIndex(i)}
                    className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all ${
                      contractorIndex === i
                        ? "bg-cyan-500/15 border-cyan-500/50 text-white"
                        : "bg-slate-900/40 border-slate-800 text-slate-400 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-base">{c.icon}</span>
                      <div>
                        <div className="font-semibold text-white">{c.name}</div>
                        <div className="text-[10px] text-slate-400">{c.zone}</div>
                      </div>
                    </div>
                    <input
                      type="radio"
                      name="contractor"
                      checked={contractorIndex === i}
                      onChange={() => setContractorIndex(i)}
                      className="accent-cyan-400"
                    />
                  </label>
                ))}
              </div>
            </div>

            {/* SLA Resolution Deadline */}
            <div>
              <label className="text-slate-400 font-semibold uppercase tracking-wider block mb-1.5">
                Remediation SLA Target
              </label>
              <div className="grid grid-cols-2 gap-2">
                {SLA_OPTIONS.map((sla) => (
                  <button
                    type="button"
                    key={sla.hours}
                    onClick={() => setSlaHours(sla.hours)}
                    className={`p-2 rounded-xl border text-left font-medium transition-all ${
                      slaHours === sla.hours
                        ? `${sla.badge} ring-1 ring-cyan-400`
                        : "bg-slate-900/40 border-slate-800 text-slate-400 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{sla.hours} Hours</span>
                    </div>
                    <div className="text-[10px] opacity-80 mt-0.5">{sla.label.split("(")[1]?.replace(")", "")}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Special Instructions */}
            <div>
              <label className="text-slate-400 font-semibold uppercase tracking-wider block mb-1">
                Dispatch Instructions / Work Order Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="E.g. Road blockage diversion required. Cold-mix asphalt patch team assigned."
                rows={2}
                className="w-full bg-slate-900/70 border border-slate-800 rounded-xl p-2 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 resize-none text-xs"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  const googleMapsUrl = `https://maps.google.com/?q=${incident.lat},${incident.lng}`;
                  const msg = encodeURIComponent(
                    `🚨 *URGENT MUNICIPAL WORK ORDER*\n` +
                    `🏢 Agency: ${CONTRACTORS[contractorIndex].name}\n` +
                    `📍 Location: ${incident.location} (${incident.ward})\n` +
                    `⚠️ Hazard: ${incident.type} (${incident.severity} Priority)\n` +
                    `⏳ SLA: ${slaHours} Hours\n` +
                    `🗺️ Navigation: ${googleMapsUrl}`
                  );
                  window.open(`https://wa.me/?text=${msg}`, "_blank");
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/25 text-xs font-semibold transition-all"
                title="Send directly to contractor on WhatsApp"
              >
                <span>📲</span>
                <span>Dispatch via WhatsApp</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold shadow-lg shadow-cyan-500/20 transition-all disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{submitting ? "Dispatching..." : "Confirm Dispatch Order"}</span>
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
