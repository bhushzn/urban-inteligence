import React, { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";

interface LiveDashcamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSnapshotReport?: () => void;
}

interface CameraDevice {
  deviceId: string;
  label: string;
}

// MJPEG refresh stream for /shot.jpg endpoints (IP Webcam)
const MjpegStream: React.FC<{ url: string }> = ({ url }) => {
  const [src, setSrc] = useState(url);
  useEffect(() => {
    const id = setInterval(() => setSrc(url.split("?")[0] + "?t=" + Date.now()), 100);
    return () => clearInterval(id);
  }, [url]);
  return <img src={src} alt="IP Camera stream" className="absolute inset-0 w-full h-full object-cover" />;
};

export const LiveDashcamModal: React.FC<LiveDashcamModalProps> = ({
  isOpen,
  onClose,
  onSnapshotReport,
}) => {
  const [speed, setSpeed] = useState<number>(38);
  const [hazardDetected, setHazardDetected] = useState<boolean>(true);
  const [anomalyCount, setAnomalyCount] = useState<number>(14);
  const [activeBus, setActiveBus] = useState<string>("Bus #102 (BRTS Line-A)");

  // ── Camera Mode: sim | device | ip ─────────────────────────────────────────
  type CamMode = "sim" | "device" | "ip";
  const [cameraMode, setCameraMode] = useState<CamMode>("sim");

  // ── Device camera state ────────────────────────────────────────────────────
  const [devices, setDevices] = useState<CameraDevice[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");
  const [camError, setCamError] = useState<string | null>(null);
  const [camReady, setCamReady] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // ── IP camera state ────────────────────────────────────────────────────────
  const [ipUrl, setIpUrl] = useState<string>("http://192.168.1.100:8080/video");
  const [ipConnected, setIpConnected] = useState<boolean>(false);
  const ipVideoRef = useRef<HTMLVideoElement>(null);
  const [showIpHelp, setShowIpHelp] = useState<boolean>(false);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCamReady(false);
  }, []);

  const loadDevices = useCallback(async () => {
    try {
      // Must request permission first so device labels are populated
      await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      const all = await navigator.mediaDevices.enumerateDevices();
      const cams = all
        .filter((d) => d.kind === "videoinput")
        .map((d, i) => ({ deviceId: d.deviceId, label: d.label || `Camera ${i + 1}` }));
      setDevices(cams);
      if (cams.length > 0) setSelectedDeviceId((prev) => prev || cams[0].deviceId);
    } catch {
      setCamError("Could not list cameras. Please allow camera permission.");
    }
  }, []);

  const startCamera = useCallback(async (deviceId?: string) => {
    setCamError(null);
    setCamReady(false);
    stopStream();
    try {
      const constraints: MediaStreamConstraints = {
        video: deviceId
          ? { deviceId: { exact: deviceId }, width: { ideal: 1280 }, height: { ideal: 720 } }
          : { width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setCamReady(true);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("NotAllowedError") || msg.includes("Permission")) setCamError("Camera permission denied. Allow in browser settings.");
      else if (msg.includes("NotFoundError")) setCamError("Selected camera not found or disconnected.");
      else if (msg.includes("NotReadableError")) setCamError("Camera busy — close Teams/Zoom/Meet first.");
      else setCamError(`Camera error: ${msg}`);
    }
  }, [stopStream]);

  const connectIpCamera = useCallback(() => {
    setIpConnected(false);
    setTimeout(() => setIpConnected(true), 400);
    if (ipVideoRef.current) {
      ipVideoRef.current.src = ipUrl;
      ipVideoRef.current.load();
      ipVideoRef.current.play().catch(() => {});
    }
  }, [ipUrl]);

  // Start/stop device camera when mode or device changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (cameraMode === "device" && isOpen) { loadDevices().then(() => startCamera(selectedDeviceId)); }
    else { stopStream(); }
    if (cameraMode !== "ip") setIpConnected(false);
  }, [cameraMode, isOpen]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (cameraMode === "device" && isOpen && selectedDeviceId) startCamera(selectedDeviceId); }, [selectedDeviceId]);

  useEffect(() => { if (!isOpen) { stopStream(); setCameraMode("sim"); setIpConnected(false); } }, [isOpen, stopStream]);

  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setSpeed(Math.round(35 + Math.random() * 12));
      if (Math.random() > 0.3) setHazardDetected(true);
    }, 2000);
    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;
  const isMjpegShot = ipUrl.includes("shot.jpg");

  const HUDSpeed = () => (
    <div className="absolute top-4 right-4 font-mono text-white bg-black/60 backdrop-blur-md px-3 py-2 rounded-lg border border-white/10 text-right">
      <div className="text-2xl font-black text-cyan-400 leading-none">{speed} <span className="text-xs font-normal text-slate-300">KM/H</span></div>
      <div className="text-[10px] text-slate-400 mt-0.5">VEHICLE SPEED</div>
    </div>
  );

  const SnapBar = ({ label }: { label: string }) => (
    <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between font-mono text-xs text-white bg-black/70 backdrop-blur-md px-4 py-2 rounded-lg border border-white/10">
      <span className="font-bold text-emerald-400">{label}</span>
      <button onClick={() => { setAnomalyCount(c => c + 1); onSnapshotReport ? onSnapshotReport() : alert("📸 Snapshot captured!"); }} className="px-3 py-1.5 rounded bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center space-x-1.5 transition-all"><span>📸</span><span>Snapshot</span></button>
    </div>
  );

  return createPortal(
    <div
      className="fixed inset-0 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in"
      style={{ zIndex: 999999 }}
    >
      <div
        className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
        role="dialog"
        aria-labelledby="modal-dashcam-title"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-900 via-rose-950/30 to-slate-900">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 text-xl font-bold">
              📹
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 id="modal-dashcam-title" className="text-lg font-bold text-white tracking-wide">
                  Live Transit Fleet Dashcam — AI Edge Stream
                </h2>
                <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center space-x-1">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping inline-block" />
                  <span>LIVE 1080P</span>
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Municipal bus fleet edge dashcam with real-time YOLOv8 neural inference overlay.
              </p>
            </div>
          </div>

          {/* Mode Toggle + Close */}
          <div className="flex items-center space-x-3">
            {/* 3-way Mode Toggle */}
            <div className="flex items-center bg-slate-800 border border-slate-700 rounded-xl p-1 space-x-1">
              <button onClick={() => setCameraMode("sim")} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${cameraMode === "sim" ? "bg-rose-600 text-white shadow shadow-rose-600/30" : "text-slate-400 hover:text-white"}`}>🎬 SIM</button>
              <button onClick={() => setCameraMode("device")} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${cameraMode === "device" ? "bg-emerald-600 text-white shadow shadow-emerald-600/30" : "text-slate-400 hover:text-white"}`}>📷 DEVICE</button>
              <button onClick={() => setCameraMode("ip")} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${cameraMode === "ip" ? "bg-violet-600 text-white shadow shadow-violet-600/30" : "text-slate-400 hover:text-white"}`}>📡 IP CAM</button>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">✕</button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-4 custom-scrollbar flex-1">

          {/* ══ SIM MODE ═══════════════════════════════════════════════════════ */}
          {cameraMode === "sim" && (
            <>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-slate-400 font-medium">Select Patrol Rover:</span>
                  {["Bus #102 (BRTS Line-A)", "Bus #204 (Kolar Express)", "Bus #315 (VIP Lakefront)"].map((bus) => (
                    <button key={bus} onClick={() => setActiveBus(bus)} className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${activeBus === bus ? "bg-rose-600 text-white shadow-md shadow-rose-600/30" : "bg-slate-800 text-slate-400 hover:text-white border border-slate-700"}`}>{bus}</button>
                  ))}
                </div>
                <div className="text-xs font-mono text-emerald-400 flex items-center space-x-1.5"><span className="w-2 h-2 rounded-full bg-emerald-400" /><span>YOLOv8 Edge: 14ms Inference</span></div>
              </div>
              <div className="relative w-full h-80 md:h-96 rounded-xl overflow-hidden border border-slate-700 bg-slate-950 flex items-center justify-center select-none shadow-inner">
                <img src="https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=1200&q=80" alt="Live Dashcam Stream" className="absolute inset-0 w-full h-full object-cover opacity-80 filter brightness-95 contrast-110" />
                <div className="absolute inset-0 pointer-events-none opacity-20" style={{ backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.5) 2px, rgba(0,0,0,0.5) 4px)" }} />
                {hazardDetected && (
                  <div className="absolute border-2 border-rose-500 bg-rose-500/15 rounded shadow-[0_0_15px_rgba(244,63,94,0.6)] animate-pulse" style={{ top: "54%", left: "38%", width: "28%", height: "24%" }}>
                    <div className="absolute -top-6 left-0 bg-rose-600 text-white font-mono font-bold text-[11px] px-2 py-0.5 rounded shadow flex items-center space-x-1"><span>⚠️</span><span>POTHOLE: 94.6%</span></div>
                    <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-white" /><div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-white" />
                    <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-white" /><div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-white" />
                  </div>
                )}
                <div className="absolute top-4 left-4 font-mono text-xs text-white bg-black/60 backdrop-blur-md px-3 py-2 rounded-lg border border-white/10 space-y-0.5">
                  <div className="text-rose-400 font-bold flex items-center space-x-1.5"><span className="w-2 h-2 rounded-full bg-rose-500 animate-ping inline-block" /><span>{activeBus}</span></div>
                  <div className="text-slate-300 text-[11px]">CAM-01 • SONY STARVIS 1080P</div>
                  <div className="text-slate-400 text-[10px]">LAT 23.8324° N | LNG 77.7915° E</div>
                </div>
                <HUDSpeed />
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between font-mono text-xs text-white bg-black/70 backdrop-blur-md px-4 py-2 rounded-lg border border-white/10">
                  <div className="flex items-center space-x-4">
                    <div><span className="text-slate-400 text-[10px] block">TODAY'S ANOMALIES</span><span className="font-bold text-amber-400">{anomalyCount} Flagged</span></div>
                    <div><span className="text-slate-400 text-[10px] block">SENSOR STATUS</span><span className="font-bold text-emerald-400">CALIBRATED</span></div>
                  </div>
                  <button onClick={() => { setAnomalyCount(c => c + 1); onSnapshotReport ? onSnapshotReport() : alert("📸 Incident Snapshot captured!"); }} className="px-3 py-1.5 rounded bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center space-x-1.5 transition-all shadow-md shadow-rose-600/30"><span>📸</span><span>Snapshot Anomaly</span></button>
                </div>
              </div>
            </>
          )}

          {/* ══ DEVICE CAM MODE ════════════════════════════════════════════════ */}
          {cameraMode === "device" && (
            <>
              <div className="flex items-center space-x-3">
                <span className="text-xs text-slate-400 font-medium whitespace-nowrap">📷 Select Camera:</span>
                <select value={selectedDeviceId} onChange={(e) => setSelectedDeviceId(e.target.value)} className="flex-1 bg-slate-800 border border-slate-600 text-white text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500 transition-colors">
                  {devices.length === 0 && <option>Loading cameras…</option>}
                  {devices.map((d) => <option key={d.deviceId} value={d.deviceId}>{d.label}</option>)}
                </select>
                <button onClick={loadDevices} className="px-3 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-xs font-medium border border-slate-600">🔄 Refresh</button>
              </div>
              <div className="flex items-start space-x-2 bg-violet-950/30 border border-violet-700/40 rounded-xl px-4 py-3 text-xs">
                <span className="text-violet-400 text-lg">📱</span>
                <div className="text-slate-300 space-y-1">
                  <p className="font-semibold text-violet-300">Using your phone camera?</p>
                  <p><span className="font-medium text-white">Windows Phone Link:</span> Open Phone Link on Windows → pair your Android → camera appears in the dropdown above automatically.</p>
                  <p><span className="font-medium text-white">DroidCam (Android/iOS):</span> Install DroidCam on phone + PC → connect via USB or Wi-Fi → appears as a webcam in the list.</p>
                  <p>No software? Try the <span className="text-violet-300 font-bold">📡 IP CAM</span> tab — just Wi-Fi, no PC install needed!</p>
                </div>
              </div>
              <div className="relative w-full h-80 md:h-96 rounded-xl overflow-hidden border border-emerald-600/50 bg-slate-950 flex items-center justify-center shadow-inner">
                {camError ? (
                  <div className="text-center px-6 space-y-3"><div className="text-4xl">🚫</div><p className="text-sm text-rose-400 font-medium">{camError}</p><button onClick={() => startCamera(selectedDeviceId)} className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold">🔄 Retry</button></div>
                ) : !camReady ? (
                  <div className="text-center space-y-2"><div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" /><p className="text-xs text-slate-400">Opening camera… allow browser permission if prompted.</p></div>
                ) : (
                  <>
                    <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover" />
                    <div className="absolute inset-0 pointer-events-none opacity-10" style={{ backgroundImage: "repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,.5) 2px,rgba(0,0,0,.5) 4px)" }} />
                    <div className="absolute top-4 left-4 flex items-center space-x-1.5 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-emerald-500/40">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block" />
                      <span className="text-xs font-mono font-bold text-emerald-300">{devices.find(d => d.deviceId === selectedDeviceId)?.label || "LIVE CAMERA"}</span>
                    </div>
                    <HUDSpeed />
                    <SnapBar label="📷 Device Camera — Real Feed" />
                  </>
                )}
              </div>
            </>
          )}

          {/* ══ IP CAM MODE ════════════════════════════════════════════════════ */}
          {cameraMode === "ip" && (
            <>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-slate-400 whitespace-nowrap">📡 Stream URL:</span>
                  <input type="text" value={ipUrl} onChange={(e) => setIpUrl(e.target.value)} placeholder="http://192.168.x.x:8080/video" className="flex-1 bg-slate-800 border border-slate-600 text-white text-xs font-mono rounded-lg px-3 py-2 focus:outline-none focus:border-violet-500 transition-colors placeholder-slate-500" />
                  <button onClick={connectIpCamera} className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition-all shadow shadow-violet-600/30">Connect</button>
                  <button onClick={() => setShowIpHelp(!showIpHelp)} className="px-3 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs border border-slate-600">❓ Help</button>
                </div>
                <div className="flex items-center space-x-2 flex-wrap gap-y-2">
                  <span className="text-xs text-slate-500">Presets:</span>
                  {[
                    { l: "IP Webcam Android :8080", u: "http://192.168.1.100:8080/video" },
                    { l: "IP Webcam MJPEG", u: "http://192.168.1.100:8080/shot.jpg" },
                    { l: "DroidCam :4747", u: "http://192.168.1.100:4747/mjpegfeed" },
                    { l: "EpocCam iPhone", u: "http://192.168.1.100:2431/live" },
                  ].map(p => (
                    <button key={p.l} onClick={() => setIpUrl(p.u)} className="px-2 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-[11px] border border-slate-700 transition-colors">{p.l}</button>
                  ))}
                </div>
                {showIpHelp && (
                  <div className="bg-slate-800/60 border border-violet-700/40 rounded-xl px-4 py-4 text-xs space-y-3">
                    <p className="text-violet-300 font-semibold text-sm">📱 Stream your phone camera over Wi-Fi (no USB, no PC app!)</p>
                    <div className="bg-slate-900/60 rounded-lg p-3 space-y-1">
                      <p className="font-bold text-white">✅ Easiest: IP Webcam (Android, Free)</p>
                      <ol className="list-decimal list-inside space-y-0.5 text-slate-300">
                        <li>Install <span className="text-violet-300">IP Webcam</span> from Play Store</li>
                        <li>Open → scroll down → tap <span className="font-mono bg-slate-700 px-1 rounded">Start server</span></li>
                        <li>Note the IP shown (e.g. <span className="font-mono bg-slate-700 px-1 rounded">192.168.1.105:8080</span>)</li>
                        <li>Replace IP in URL above → click <span className="text-violet-300 font-bold">Connect</span></li>
                      </ol>
                      <p className="text-amber-400 text-[11px]">⚠️ Phone and laptop must be on the same Wi-Fi</p>
                    </div>
                    <div className="bg-slate-900/60 rounded-lg p-3">
                      <p className="font-bold text-white mb-1">📱 iPhone: EpocCam app</p>
                      <p className="text-slate-300">Install EpocCam on iPhone → select EpocCam preset URL above → Connect</p>
                    </div>
                    <div className="bg-slate-900/60 rounded-lg p-3">
                      <p className="font-bold text-white mb-1">💻 DroidCam / Phone Link (needs PC install)</p>
                      <p className="text-slate-300">Phone appears as a webcam → switch to <span className="text-emerald-300">📷 DEVICE</span> tab and select it from dropdown</p>
                    </div>
                  </div>
                )}
              </div>
              <div className="relative w-full h-80 md:h-96 rounded-xl overflow-hidden border border-violet-600/50 bg-slate-950 flex items-center justify-center shadow-inner">
                {!ipConnected ? (
                  <div className="text-center space-y-3 px-6"><div className="text-5xl">📡</div><p className="text-sm text-slate-300">Enter your phone IP camera URL and click <span className="text-violet-300 font-bold">Connect</span></p><p className="text-xs text-slate-500">Works with IP Webcam, DroidCam, EpocCam, Camo, and any MJPEG stream</p></div>
                ) : (
                  <>
                    {isMjpegShot ? <MjpegStream url={ipUrl} /> : <video ref={ipVideoRef} src={ipUrl} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover" onError={() => {}} />}
                    <div className="absolute inset-0 pointer-events-none opacity-10" style={{ backgroundImage: "repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,.5) 2px,rgba(0,0,0,.5) 4px)" }} />
                    <div className="absolute top-4 left-4 flex items-center space-x-1.5 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-violet-500/40">
                      <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse inline-block" />
                      <span className="text-xs font-mono font-bold text-violet-300">IP CAMERA — PHONE STREAM</span>
                    </div>
                    <HUDSpeed />
                    <SnapBar label="📡 Phone IP Camera" />
                  </>
                )}
              </div>
            </>
          )}

          {/* Telemetry Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3"><div className="text-[10px] uppercase font-bold text-slate-400">Telemetry Frame Rate</div><div className="text-base font-bold text-white mt-0.5">30.0 FPS</div><div className="text-[10px] text-slate-500">H.264 Low Latency Stream</div></div>
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3"><div className="text-[10px] uppercase font-bold text-slate-400">Edge Hardware</div><div className="text-base font-bold text-indigo-400 mt-0.5">NVIDIA Jetson Nano</div><div className="text-[10px] text-slate-500">On-bus embedded unit</div></div>
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3"><div className="text-[10px] uppercase font-bold text-slate-400">Detection Model</div><div className="text-base font-bold text-emerald-400 mt-0.5">YOLOv8n Anomaly</div><div className="text-[10px] text-slate-500">96.2% Indian Road mAP</div></div>
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3"><div className="text-[10px] uppercase font-bold text-slate-400">Transit Network</div><div className="text-base font-bold text-cyan-400 mt-0.5">5G Municipal Mesh</div><div className="text-[10px] text-slate-500">Bhopal BRTS Corridor</div></div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            {cameraMode === "device" && "📷 Device camera — Phone Link/DroidCam cameras appear in dropdown automatically"}
            {cameraMode === "ip" && "📡 IP stream — phone and laptop must be on the same Wi-Fi network"}
            {cameraMode === "sim" && "🎬 Simulated AI bus dashcam — 48 patrol rovers across Bhopal"}
          </span>
          <button onClick={onClose} className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors">Close Feed</button>
        </div>
      </div>
    </div>,
    document.getElementById("modal-root") || document.body
  );
};
