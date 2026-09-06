import { useState, useEffect, useCallback } from "react";
import Navbar from "./components/Navbar";
import MapView from "./components/MapView";
import IncidentFeed from "./components/IncidentFeed";
import AnalyticsPanel from "./components/AnalyticsPanel";
import ReportModal from "./components/ReportModal";
import { api, connectWebSocket } from "./api";
import type { Incident, Analytics, WSEvent } from "./api";

export default function App() {
  const [incidents,      setIncidents]      = useState<Incident[]>([]);
  const [analytics,      setAnalytics]      = useState<Analytics | null>(null);
  const [activeIncident, setActiveIncident] = useState<Incident | null>(null);
  const [wsConnected,    setWsConnected]    = useState(false);
  const [showReport,     setShowReport]     = useState(false);
  const [exportToast,    setExportToast]    = useState(false);
  const [mapLayers,      setMapLayers]      = useState({ heatmap: false, fleet: true, potholes: true });
  const [notification,   setNotification]   = useState<string | null>(null);

  // Load incidents & analytics
  async function loadAll() {
    try {
      const [incs, an] = await Promise.all([api.getIncidents(), api.getAnalytics()]);
      setIncidents(incs);
      setAnalytics(an);
    } catch (e) {
      console.error("Backend not reachable", e);
    }
  }

  useEffect(() => {
    loadAll();

    // WebSocket for live updates
    const disconnect = connectWebSocket(
      (event: WSEvent) => {
        if (event.event === "new_incident") {
          setIncidents(prev => [event.data, ...prev]);
          setNotification(`🚨 New: ${event.data.type} in ${event.data.ward}`);
          setTimeout(() => setNotification(null), 4000);
          // Refresh analytics
          api.getAnalytics().then(setAnalytics).catch(() => {});
        } else if (event.event === "incident_updated") {
          setIncidents(prev => prev.map(i => i.id === event.data.id ? event.data : i));
        }
      },
      () => setWsConnected(true),
      () => setWsConnected(false),
    );

    return disconnect;
  }, []);

  const handleSelectIncident = useCallback((inc: Incident) => {
    setActiveIncident(prev => prev?.id === inc.id ? null : inc);
  }, []);

  const handleVerify = useCallback(async (id: number) => {
    const updated = await api.verifyIncident(id);
    setIncidents(prev => prev.map(i => i.id === id ? updated : i));
    api.getAnalytics().then(setAnalytics).catch(() => {});
  }, []);

  const handleResolve = useCallback(async (id: number) => {
    const updated = await api.resolveIncident(id);
    setIncidents(prev => prev.map(i => i.id === id ? updated : i));
    api.getAnalytics().then(setAnalytics).catch(() => {});
  }, []);

  const handleExport = useCallback(() => {
    // Build CSV
    const rows = ["ID,Type,Severity,Ward,Location,Lat,Lng,Verified,Resolved,Timestamp"];
    incidents.forEach(i => {
      rows.push(`${i.id},"${i.type}",${i.severity},"${i.ward}","${i.location}",${i.lat},${i.lng},${i.verified},${i.resolved},"${i.timestamp_label}"`);
    });
    const blob = new Blob([rows.join("\n")], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `UrbanIntel_Ward_Report_${new Date().toLocaleDateString("en-IN").replace(/\//g,"-")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setExportToast(true);
    setTimeout(() => setExportToast(false), 3000);
  }, [incidents]);

  const toggleLayer = useCallback((layer: "heatmap" | "fleet" | "potholes") => {
    setMapLayers(prev => ({ ...prev, [layer]: !prev[layer] }));
  }, []);

  return (
    <div className="min-h-screen" style={{ background: "radial-gradient(ellipse at 20% 20%, #0d1a2e 0%, #0a0f1e 50%, #050810 100%)" }}>
      {/* Background glow orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #22d3ee, transparent)" }} />
        <div className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full opacity-8"
          style={{ background: "radial-gradient(circle, #fbbf24, transparent)" }} />
      </div>

      {/* Toasts */}
      {exportToast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[999] glass rounded-xl px-5 py-3 border border-cyan-500/40 text-cyan-400 font-semibold text-sm glow-cyan fade-in-up flex items-center gap-2">
          ✅ Ward Report CSV exported!
        </div>
      )}
      {notification && (
        <div className="fixed top-20 right-6 z-[998] glass rounded-xl px-4 py-3 border border-red-500/40 text-sm glow-red fade-in-up max-w-xs">
          <p className="text-white font-semibold">{notification}</p>
          <p className="text-slate-400 text-xs mt-0.5">New incident added to live feed</p>
        </div>
      )}

      {/* Report Modal */}
      {showReport && (
        <ReportModal onClose={() => setShowReport(false)} onCreated={loadAll} />
      )}

      {/* Navbar */}
      <Navbar
        onExport={handleExport}
        onReport={() => setShowReport(true)}
        analytics={analytics}
      />

      {/* Main */}
      <main className="px-4 pb-6 mt-4 relative z-10">
        <div className="flex gap-4" style={{ minHeight: "520px" }}>
          {/* Left — Map + Analytics (70%) */}
          <div className="flex flex-col gap-4" style={{ flex: "0 0 70%" }}>
            <MapView
              incidents={incidents}
              activeIncident={activeIncident}
              onMarkerClick={handleSelectIncident}
              mapLayers={mapLayers}
              onToggleLayer={toggleLayer}
            />
            <AnalyticsPanel analytics={analytics} />
          </div>

          {/* Right — Incident Feed (30%) */}
          <div style={{ flex: "0 0 30%" }} className="flex flex-col">
            <div className="sticky top-24" style={{ maxHeight: "calc(100vh - 7rem)", display: "flex", flexDirection: "column" }}>
              <IncidentFeed
                incidents={incidents}
                activeId={activeIncident?.id ?? null}
                wsConnected={wsConnected}
                onSelect={handleSelectIncident}
                onVerify={handleVerify}
                onResolve={handleResolve}
              />
            </div>
          </div>
        </div>
      </main>

      <div className="text-center pb-4 text-xs text-slate-600">
        UrbanIntel AI • Smart India Hackathon 2024 • Problem Statement 26124 • Built with ❤️ for civic safety
      </div>
    </div>
  );
}
