import React, { useState } from "react";
import { createPortal } from "react-dom";
import { X, UploadCloud, Sparkles, CheckCircle2, Loader2, Navigation } from "lucide-react";
import { api } from "../api";
import type { AIResult } from "../api";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onReportSubmitted: () => void;
}

const CATEGORIES = [
  { id: "road", label: "Pothole / Road Damage", icon: "🕳️" },
  { id: "bus_lane", label: "Bus Lane Encroachment", icon: "🚌" },
  { id: "garbage", label: "Garbage Overflow", icon: "🗑️" },
  { id: "water", label: "Waterlogging / Drainage", icon: "🌊" },
  { id: "infrastructure", label: "Broken Streetlight", icon: "💡" },
  { id: "encroachment", label: "Illegal Encroachment", icon: "🚫" },
  { id: "animal", label: "Stray Animal Hazard", icon: "🐕" },
];

export const CitizenPortalModal: React.FC<Props> = ({ isOpen, onClose, onReportSubmitted }) => {
  const [category, setCategory] = useState("road");
  const [locationName, setLocationName] = useState("");
  const [ward, setWard] = useState("Ward 7");
  const [lat, setLat] = useState("23.8300");
  const [lng, setLng] = useState("77.7700");
  const [locating, setLocating] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [aiResult, setAiResult] = useState<AIResult | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [ticketId, setTicketId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude.toFixed(4));
        setLng(pos.coords.longitude.toFixed(4));
        if (!locationName) {
          setLocationName(`Near GPS Coordinates (${pos.coords.latitude.toFixed(3)}, ${pos.coords.longitude.toFixed(3)})`);
        }
        setLocating(false);
      },
      (err) => {
        alert(`Location access denied or unavailable: ${err.message}. Using default coordinates.`);
        setLocating(false);
      },
      { timeout: 8000 }
    );
  };

  const handleImageChange = async (file: File | null) => {
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));

    // Run preview analysis
    setAnalyzing(true);
    try {
      const result = await api.analyzeImage(file, category);
      setAiResult(result);
    } catch {
      // Fallback silent
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const form = new FormData();
      const incType = aiResult?.type || CATEGORIES.find((c) => c.id === category)?.label || "Road Hazard";
      const severity = aiResult?.severity || "Medium";

      form.append("type", incType);
      form.append("severity", severity);
      form.append("lat", lat);
      form.append("lng", lng);
      form.append("ward", ward);
      form.append("location", locationName || `${ward}, Bhopal`);
      form.append("category", category);
      if (imageFile) form.append("image", imageFile);

      await api.createIncident(form);
      const generatedTicket = `BPL-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      setTicketId(generatedTicket);
      onReportSubmitted();
    } catch (err: any) {
      alert(err.message || "Failed to submit citizen report.");
    } finally {
      setSubmitting(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{ zIndex: 999999 }}
    >
      <div className="absolute inset-0 bg-black/75 backdrop-blur-md" onClick={onClose} />

      <div className="relative glass glow-cyan rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 border border-emerald-500/30 fade-in-up">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-700/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-emerald-500/20">
              📢
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white font-display">Citizen Portal</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                  Public Access
                </span>
              </div>
              <p className="text-xs text-slate-400">Report an incident to the Municipal Command Center.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800/80 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {ticketId ? (
          <div className="py-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center mx-auto text-emerald-400">
              <CheckCircle2 className="w-10 h-10 animate-bounce" />
            </div>
            <div className="space-y-1">
              <h4 className="text-lg font-bold text-white">Grievance Submitted Successfully!</h4>
              <p className="text-xs text-slate-400">
                Your report has been received by the Municipal Command Center.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 max-w-xs mx-auto space-y-1">
              <span className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">Grievance Ticket ID</span>
              <div className="font-mono font-bold text-lg text-cyan-400">{ticketId}</div>
              <p className="text-[10px] text-slate-400">Save this reference ID to track repair SLA progress.</p>
            </div>

            <button
              onClick={onClose}
              className="px-6 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors"
            >
              Done & Return to Dashboard
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* Category Selector */}
            <div>
              <label className="text-slate-400 font-semibold uppercase tracking-wider block mb-2">
                What Civic Hazard are you Reporting?
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {CATEGORIES.map((c) => (
                  <button
                    type="button"
                    key={c.id}
                    onClick={() => setCategory(c.id)}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-left transition-all ${
                      category === c.id
                        ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-300 shadow-sm"
                        : "bg-slate-900/50 border-slate-800 text-slate-400 hover:border-slate-700"
                    }`}
                  >
                    <span className="text-lg">{c.icon}</span>
                    <span className="font-medium text-[11px] leading-tight">{c.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Image Upload with AI Preview */}
            <div>
              <label className="text-slate-400 font-semibold uppercase tracking-wider block mb-1.5">
                Upload Photo Evidence
              </label>
              <div className="flex gap-3">
                <label className="flex-1 border-2 border-dashed border-slate-700/60 hover:border-emerald-500/50 bg-slate-900/40 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition-colors group">
                  <UploadCloud className="w-6 h-6 text-slate-500 group-hover:text-emerald-400 transition-colors mb-1" />
                  <span className="text-xs text-slate-300 font-medium">Click to select photo</span>
                  <span className="text-[10px] text-slate-500">JPG, PNG, WebP up to 10MB</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleImageChange(e.target.files?.[0] || null)}
                  />
                </label>

                {imagePreview && (
                  <div className="w-28 h-24 rounded-xl overflow-hidden border border-slate-700 relative shrink-0">
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    {analyzing && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* AI Real-time Detection Preview Card */}
              {aiResult && (
                <div className="mt-2 p-2.5 rounded-lg bg-cyan-950/30 border border-cyan-500/40 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    <div>
                      <span className="font-bold text-white text-[11px]">AI Detected: {aiResult.type}</span>
                      <div className="text-[10px] text-slate-400">Confidence: {Math.round(aiResult.confidence * 100)}%</div>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-400 text-[10px] font-bold">
                    {aiResult.severity} Priority
                  </span>
                </div>
              )}
            </div>

            {/* Location & GPS Detection */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-slate-400 font-semibold uppercase tracking-wider block">
                  Location & Ward
                </label>
                <button
                  type="button"
                  onClick={handleGetLocation}
                  disabled={locating}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-400 font-semibold text-[11px] transition-colors border border-cyan-500/30"
                >
                  <Navigation className={`w-3 h-3 ${locating ? "animate-spin" : ""}`} />
                  <span>{locating ? "Locating..." : "📍 Use My GPS Location"}</span>
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <input
                    type="text"
                    required
                    value={locationName}
                    onChange={(e) => setLocationName(e.target.value)}
                    placeholder="Street name or landmark (e.g. Near Roshanpura Sq.)"
                    className="w-full bg-slate-900/70 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 text-xs"
                  />
                </div>
                <div>
                  <select
                    value={ward}
                    onChange={(e) => setWard(e.target.value)}
                    className="w-full bg-slate-900/70 border border-slate-800 rounded-xl px-2.5 py-2 text-white focus:outline-none focus:border-emerald-500/50 text-xs"
                  >
                    {["Ward 1", "Ward 2", "Ward 3", "Ward 4", "Ward 5", "Ward 6", "Ward 7", "Ward 8", "Ward 9", "Ward 10", "Ward 11", "Ward 12", "Ward 14", "Ward 15", "Ward 18"].map(w => (
                      <option key={w} value={w}>{w}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 font-mono">
                <div>Lat: <span className="text-white">{lat}</span></div>
                <div>Lng: <span className="text-white">{lng}</span></div>
              </div>
            </div>

            {/* Submit Action */}
            <div className="pt-2 border-t border-slate-800 flex items-center justify-end gap-2">
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
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{submitting ? "Submitting..." : "Submit Grievance to BMC"}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>,
    document.getElementById("modal-root") || document.body
  );
};
