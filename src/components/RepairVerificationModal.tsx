import React, { useState } from "react";
import { api } from "../api";
import type { Incident, WorkOrder, RepairVerificationResult } from "../api";

interface RepairVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  incident: Incident | null;
  workOrder?: WorkOrder | null;
  onVerificationComplete?: (result: RepairVerificationResult) => void;
}

export const RepairVerificationModal: React.FC<RepairVerificationModalProps> = ({
  isOpen,
  onClose,
  incident,
  workOrder,
  onVerificationComplete,
}) => {
  const [sliderPosition, setSliderPosition] = useState<number>(50);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [notes, setNotes] = useState<string>("Asphalt patch compacted with 5-ton vibratory roller. Surface level verified.");
  const [inspectorName, setInspectorName] = useState<string>("Er. Rajesh Sharma (Bhopal Smart City PWD)");
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [verifiedResult, setVerifiedResult] = useState<RepairVerificationResult | null>(null);

  if (!isOpen || !incident) return null;

  // Fallback demo after-repair image if none selected
  const demoAfterUrl =
    "https://images.unsplash.com/photo-1578874691223-a4558a08cde6?auto=format&fit=crop&w=800&q=80";

  const beforeImageUrl =
    incident.image_url ||
    "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80";

  const currentAfterUrl = previewUrl || demoAfterUrl;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleVerify = async () => {
    try {
      setSubmitting(true);
      setError(null);

      const targetOrderId = workOrder?.id || 1; // Default to 1 if not linked
      const formData = new FormData();
      if (selectedFile) {
        formData.append("after_image", selectedFile);
      }
      formData.append("notes", notes);
      formData.append("inspector_name", inspectorName);
      formData.append("repair_score", "96.5");

      const result = await api.verifyRepair(targetOrderId, formData);
      setVerifiedResult(result);
      if (onVerificationComplete) {
        onVerificationComplete(result);
      }
    } catch (err: any) {
      console.error("Verification error:", err);
      setError(err?.message || "Failed to verify repair.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div
        className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
        role="dialog"
        aria-labelledby="modal-verify-title"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-900 via-emerald-950/20 to-slate-900">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 text-xl font-bold">
              🛠️
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 id="modal-verify-title" className="text-lg font-bold text-white tracking-wide">
                  Contractor Proof-of-Work & Repair Verification
                </h2>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  AI Quality Audit
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Incident #{incident.id} ({incident.type} in {incident.ward}, {incident.location})
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

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 custom-scrollbar flex-1">
          {error && (
            <div className="p-3 bg-rose-500/20 border border-rose-500/40 rounded-xl text-rose-300 text-xs flex items-center space-x-2">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {verifiedResult ? (
            /* Success View */
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-3xl mx-auto text-emerald-400 animate-bounce">
                ✓
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-white">Repair Successfully Verified & Closed</h3>
                <p className="text-xs text-slate-400">
                  Incident #{incident.id} has been resolved. Work Order closed with SLA compliance.
                </p>
              </div>

              <div className="max-w-md mx-auto bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 text-left space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Repair Confidence Score:</span>
                  <span className="font-bold text-emerald-400">{verifiedResult.repair_quality_score}% Smoothness</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Verified Timestamp:</span>
                  <span className="font-medium text-slate-200">{verifiedResult.verified_at}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Authorized Municipal Inspector:</span>
                  <span className="font-medium text-slate-200">{verifiedResult.inspector}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Incident State:</span>
                  <span className="font-bold text-emerald-400 uppercase">RESOLVED</span>
                </div>
              </div>

              <button
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors shadow-lg shadow-emerald-600/30"
              >
                Done & Return to Dashboard
              </button>
            </div>
          ) : (
            /* Verification Form & Before/After Slider */
            <>
              {/* Interactive Before / After Comparison Slider */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30">
                      BEFORE: Original Hazard
                    </span>
                    <span>vs</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                      AFTER: Repaired Surface
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400">Drag slider below to compare</span>
                </div>

                <div className="relative w-full h-64 md:h-72 rounded-xl overflow-hidden border border-slate-700 select-none bg-slate-950">
                  {/* After Image (Full background) */}
                  <img
                    src={currentAfterUrl}
                    alt="After Repair"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-slate-900/80 text-[10px] font-bold text-emerald-400 border border-emerald-500/40">
                    AFTER REPAIR
                  </div>

                  {/* Before Image (Clipped by slider position) */}
                  <div
                    className="absolute inset-y-0 left-0 overflow-hidden"
                    style={{ width: `${sliderPosition}%` }}
                  >
                    <img
                      src={beforeImageUrl}
                      alt="Before Repair"
                      className="absolute inset-0 w-full h-full object-cover max-w-none"
                      style={{ width: "100%", height: "100%", minWidth: "600px" }}
                    />
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-slate-900/80 text-[10px] font-bold text-rose-400 border border-rose-500/40">
                      BEFORE HAZARD
                    </div>
                  </div>

                  {/* Slider Divider Line */}
                  <div
                    className="absolute inset-y-0 w-0.5 bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)] pointer-events-none"
                    style={{ left: `${sliderPosition}%` }}
                  >
                    <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs shadow-lg border border-white/50">
                      ↔
                    </div>
                  </div>

                  {/* Hidden range input to control slider position smoothly */}
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={sliderPosition}
                    onChange={(e) => setSliderPosition(Number(e.target.value))}
                    className="absolute inset-0 opacity-0 cursor-ew-resize w-full h-full z-10"
                    aria-label="Before after comparison slider"
                  />
                </div>
              </div>

              {/* Upload After Photo Controls */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-4 space-y-2">
                  <label className="text-xs font-bold text-slate-300 block">
                    Upload Contractor "After Repair" Photo:
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="block w-full text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-600 file:text-white hover:file:bg-emerald-500 cursor-pointer"
                  />
                  <p className="text-[10px] text-slate-400">
                    Supports JPEG, PNG, WebP up to 10MB. Or leave blank to use the high-fidelity demo patch photo.
                  </p>
                </div>

                <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-4 space-y-2">
                  <label className="text-xs font-bold text-slate-300 block">
                    Municipal Inspector / Engineer Name:
                  </label>
                  <input
                    type="text"
                    value={inspectorName}
                    onChange={(e) => setInspectorName(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Inspection Notes */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 block">
                  Quality Audit & Compaction Notes:
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 resize-none"
                  placeholder="Record compaction observations, asphalt grade used, or contractor remarks..."
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleVerify}
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-lg shadow-emerald-600/30 flex items-center space-x-1.5 disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <span className="animate-spin">🔄</span>
                      <span>Auditing Pavement...</span>
                    </>
                  ) : (
                    <>
                      <span>✓</span>
                      <span>Verify Repair & Close Incident</span>
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
