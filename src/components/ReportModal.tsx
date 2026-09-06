import { useState, useRef, useEffect } from "react";
import { X, Upload, Loader2, Camera, MapPin } from "lucide-react";
import { api } from "../api";
import type { AIResult } from "../api";

interface Props {
  onClose: () => void;
  onCreated: () => void;
}

const CATEGORIES = [
  { id: "road",           label: "Road / Pothole",   icon: "⚠️" },
  { id: "garbage",        label: "Garbage Dump",      icon: "🗑️" },
  { id: "water",          label: "Waterlogging",      icon: "💧" },
  { id: "infrastructure", label: "Infrastructure",    icon: "💡" },
  { id: "encroachment",   label: "Encroachment",      icon: "🚧" },
  { id: "animal",         label: "Animal Hazard",     icon: "🐄" },
];

const WARDS = ["Ward 2","Ward 3","Ward 4","Ward 5","Ward 6","Ward 7","Ward 8",
               "Ward 9","Ward 11","Ward 12","Ward 14","Ward 15","Ward 18"];

export default function ReportModal({ onClose, onCreated }: Props) {
  const [category, setCategory]         = useState("road");
  const [severity, setSeverity]         = useState("Medium");
  const [ward, setWard]                 = useState("Ward 7");
  const [location, setLocation]         = useState("");
  const [lat, setLat]                   = useState("23.8388");
  const [lng, setLng]                   = useState("77.7753");
  const [imageFile, setImageFile]       = useState<File | null>(null);
  const [previewUrl, setPreviewUrl]     = useState<string | null>(null);
  const [aiResult, setAiResult]         = useState<AIResult | null>(null);
  const [analyzing, setAnalyzing]       = useState(false);
  const [submitting, setSubmitting]     = useState(false);
  const [step, setStep]                 = useState<"upload" | "review" | "done">("upload");
  const fileRef = useRef<HTMLInputElement>(null);

  // Get GPS from browser
  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude.toFixed(4));
        setLng(pos.coords.longitude.toFixed(4));
      },
      () => {} // Fallback to default Bhopal coords
    );
  }, []);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setAiResult(null);

    // Auto-run AI analysis
    setAnalyzing(true);
    try {
      const result = await api.analyzeImage(file, category);
      setAiResult(result);
      setSeverity(result.severity);
      setStep("review");
    } catch {
      setStep("review");
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleSubmit() {
    setSubmitting(true);
    try {
      const form = new FormData();
      const incType = aiResult?.type ?? CATEGORIES.find(c => c.id === category)?.label ?? category;
      form.append("type",     incType);
      form.append("severity", severity);
      form.append("lat",      lat);
      form.append("lng",      lng);
      form.append("ward",     ward);
      form.append("location", location || `${ward}, Bhopal`);
      form.append("category", category);
      if (imageFile) form.append("image", imageFile);
      await api.createIncident(form);
      setStep("done");
      setTimeout(() => { onCreated(); onClose(); }, 1500);
    } catch {
      alert("Failed to submit. Is the backend running?");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative glass glow-cyan rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 fade-in-up">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-white font-display">Report Incident</h2>
            <p className="text-sm text-slate-400 mt-0.5">Field Agent Report with AI Analysis</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-slate-800/60 flex items-center justify-center text-slate-400 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {step === "done" ? (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500/50 flex items-center justify-center">
              <span className="text-3xl">✅</span>
            </div>
            <p className="text-emerald-400 font-bold text-lg">Incident Reported!</p>
            <p className="text-slate-400 text-sm">It's now live in the feed</p>
          </div>
        ) : (
          <>
            {/* Category */}
            <div className="mb-4">
              <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-2 block">Anomaly Type</label>
              <div className="grid grid-cols-3 gap-2">
                {CATEGORIES.map(c => (
                  <button
                    key={c.id}
                    onClick={() => setCategory(c.id)}
                    className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border text-xs font-medium transition-all ${
                      category === c.id
                        ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-400"
                        : "bg-slate-800/40 border-slate-700/30 text-slate-400 hover:border-slate-600/50"
                    }`}
                  >
                    <span className="text-xl">{c.icon}</span>
                    <span>{c.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Image Upload */}
            <div className="mb-4">
              <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-2 block">
                Upload Image <span className="text-cyan-400">(AI will auto-detect)</span>
              </label>
              <input ref={fileRef} type="file" accept="image/*" capture="environment"
                className="hidden" onChange={handleFileChange} />

              {previewUrl ? (
                <div className="relative rounded-xl overflow-hidden border border-slate-700/40 bg-slate-900">
                  <img src={previewUrl} alt="preview" className="w-full h-40 object-cover" />
                  {/* AI Bbox overlay */}
                  {aiResult && (
                    <div className="absolute inset-0">
                      <div className="absolute border-2 border-cyan-400 rounded"
                        style={{
                          top: `${aiResult.bbox.y}%`, left: `${aiResult.bbox.x}%`,
                          width: `${aiResult.bbox.w}%`, height: `${aiResult.bbox.h}%`,
                          boxShadow: "0 0 10px rgba(34,211,238,0.5)"
                        }}
                      >
                        <span className="absolute -top-5 left-0 text-xs bg-cyan-400 text-black font-bold px-1 rounded-sm">
                          {aiResult.type} {Math.round(aiResult.confidence * 100)}%
                        </span>
                      </div>
                    </div>
                  )}
                  {analyzing && (
                    <div className="absolute inset-0 bg-slate-900/70 flex flex-col items-center justify-center gap-2">
                      <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
                      <p className="text-cyan-400 text-sm font-semibold">AI Analyzing...</p>
                    </div>
                  )}
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="absolute top-2 right-2 w-8 h-8 rounded-lg bg-slate-900/80 flex items-center justify-center text-slate-400 hover:text-white"
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => fileRef.current?.click()}
                  className="w-full h-32 rounded-xl border-2 border-dashed border-slate-700/60 hover:border-cyan-500/40 flex flex-col items-center justify-center gap-2 text-slate-400 hover:text-cyan-400 transition-all bg-slate-800/20"
                >
                  <Upload className="w-8 h-8" />
                  <p className="text-sm font-medium">Click to upload or take photo</p>
                  <p className="text-xs text-slate-500">AI will auto-detect the anomaly type</p>
                </button>
              )}
            </div>

            {/* AI Result banner */}
            {aiResult && (
              <div className="mb-4 p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 fade-in-up">
                <p className="text-xs text-cyan-400 font-semibold mb-1">🤖 AI Detection Result ({aiResult.model})</p>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div><span className="text-slate-400">Detected:</span> <span className="text-white font-medium">{aiResult.type}</span></div>
                  <div><span className="text-slate-400">Severity:</span> <span className={`font-bold ${aiResult.severity === "High" ? "text-red-400" : aiResult.severity === "Medium" ? "text-amber-400" : "text-emerald-400"}`}>{aiResult.severity}</span></div>
                  <div><span className="text-slate-400">Confidence:</span> <span className="text-cyan-400 font-bold">{Math.round(aiResult.confidence * 100)}%</span></div>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">Processed in {aiResult.processing_time_ms}ms</p>
              </div>
            )}

            {/* Location */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1.5 block">Ward</label>
                <select
                  value={ward}
                  onChange={e => setWard(e.target.value)}
                  className="w-full bg-slate-800/60 border border-slate-700/40 rounded-xl px-3 py-2 text-sm text-white focus:border-cyan-500/50 focus:outline-none"
                >
                  {WARDS.map(w => <option key={w} value={w}>{w}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1.5 block">Severity</label>
                <select
                  value={severity}
                  onChange={e => setSeverity(e.target.value)}
                  className="w-full bg-slate-800/60 border border-slate-700/40 rounded-xl px-3 py-2 text-sm text-white focus:border-cyan-500/50 focus:outline-none"
                >
                  {["High","Medium","Low"].map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div className="mb-4">
              <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1.5 block">Location Description</label>
              <input
                type="text"
                value={location}
                onChange={e => setLocation(e.target.value)}
                placeholder="e.g. Near TT Nagar Circle, Bhopal"
                className="w-full bg-slate-800/60 border border-slate-700/40 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-cyan-500/50 focus:outline-none"
              />
            </div>

            {/* GPS */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div>
                <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> Latitude
                </label>
                <input type="number" value={lat} onChange={e => setLat(e.target.value)} step="0.0001"
                  className="w-full bg-slate-800/60 border border-slate-700/40 rounded-xl px-3 py-2 text-sm text-white focus:border-cyan-500/50 focus:outline-none" />
              </div>
              <div>
                <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> Longitude
                </label>
                <input type="number" value={lng} onChange={e => setLng(e.target.value)} step="0.0001"
                  className="w-full bg-slate-800/60 border border-slate-700/40 rounded-xl px-3 py-2 text-sm text-white focus:border-cyan-500/50 focus:outline-none" />
              </div>
            </div>

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-cyan-500 text-white font-bold text-sm hover:from-cyan-500 hover:to-cyan-400 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</> : "📡 Submit Incident Report"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
