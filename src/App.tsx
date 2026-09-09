import { useState, useEffect, useCallback, useRef } from "react";
import Navbar from "./components/Navbar";
import MapView from "./components/MapView";
import IncidentFeed from "./components/IncidentFeed";
import AnalyticsPanel from "./components/AnalyticsPanel";
import IncidentDetailDrawer from "./components/IncidentDetailDrawer";
import ReportModal from "./components/ReportModal";
import LoginModal from "./components/LoginModal";
import { ProjectShowcaseModal } from "./components/ProjectShowcaseModal";
import { WorkOrderModal } from "./components/WorkOrderModal";
import { CitizenPortalModal } from "./components/CitizenPortalModal";
import { CorridorAnalyticsModal } from "./components/CorridorAnalyticsModal";
import { RepairVerificationModal } from "./components/RepairVerificationModal";
import { ExecutiveReportModal } from "./components/ExecutiveReportModal";
import { SafeRouteModal } from "./components/SafeRouteModal";
import { LiveDashcamModal } from "./components/LiveDashcamModal";
import { CivicKarmaModal } from "./components/CivicKarmaModal";
import { WardAnalyticsModal } from "./components/WardAnalyticsModal";
import { EnvironmentalBar } from "./components/EnvironmentalBar";
import { api, connectWebSocket, getStoredUser, DEFAULT_ANALYTICS } from "./api";
import type { Incident, Analytics, WSEvent, User, SafeRouteResponse } from "./api";
import { playIncidentAlertSound, showBrowserNotification, requestBrowserNotificationPermission } from "./utils/audioAlert";
import { CheckCircle2 } from "lucide-react";

export default function App() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [analytics, setAnalytics] = useState<Analytics>(DEFAULT_ANALYTICS);
  const [activeIncident, setActiveIncident] = useState<Incident | null>(null);
  const [wsConnected, setWsConnected] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showShowcase, setShowShowcase] = useState(false);
  const [showCitizenPortal, setShowCitizenPortal] = useState(false);
  const [showPDIModal, setShowPDIModal] = useState(false);
  const [showExecReport, setShowExecReport] = useState(false);
  const [showSafeRouteModal, setShowSafeRouteModal] = useState(false);
  const [showDashcamModal, setShowDashcamModal] = useState(false);
  const [showKarmaModal, setShowKarmaModal] = useState(false);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [activeSafeRoute, setActiveSafeRoute] = useState<SafeRouteResponse | null>(null);
  const [dispatchIncidentTarget, setDispatchIncidentTarget] = useState<Incident | null>(null);
  const [verifyIncidentTarget, setVerifyIncidentTarget] = useState<Incident | null>(null);
  const [inspectIncidentTarget, setInspectIncidentTarget] = useState<Incident | null>(null);
  const [mobileTab, setMobileTab] = useState<"map" | "feed">("map");
  const [user, setUser] = useState<User | null>(() => getStoredUser());
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [exportToast, setExportToast] = useState(false);
  const [mapLayers, setMapLayers] = useState({ heatmap: false, fleet: true, potholes: true, busLane: true });
  const [notification, setNotification] = useState<string | null>(null);

  const soundRef = useRef(soundEnabled);
  soundRef.current = soundEnabled;

  // Verify auth session on load
  useEffect(() => {
    api.getMe().then((currUser) => {
      setUser(currUser);
    }).catch(() => {});
    requestBrowserNotificationPermission();
  }, []);

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
          setNotification(`🚨 New Anomaly: ${event.data.type} in ${event.data.ward}`);
          setTimeout(() => setNotification(null), 4000);

          // Audio chime & browser push
          if (soundRef.current) {
            playIncidentAlertSound(event.data.severity);
          }
          showBrowserNotification(
            `🚨 ${event.data.type} (${event.data.severity})`,
            `${event.data.ward} • ${event.data.location}`
          );

          // Refresh analytics
          api.getAnalytics().then(setAnalytics).catch(() => {});
        } else if (event.event === "incident_deleted") {
          setIncidents(prev => prev.filter(i => i.id !== (event.data as any).id));
          api.getAnalytics().then(setAnalytics).catch(() => {});
        } else if (event.event === "incident_updated" || event.event === "incident_resolved") {
          setIncidents(prev => prev.map(i => i.id === event.data.id ? event.data : i));
          api.getAnalytics().then(setAnalytics).catch(() => {});
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
    try {
      const updated = await api.verifyIncident(id);
      setIncidents(prev => prev.map(i => i.id === id ? updated : i));
      api.getAnalytics().then(setAnalytics).catch(() => {});
      setNotification(`✅ Incident #${id} successfully verified`);
      setTimeout(() => setNotification(null), 3500);
    } catch (err: any) {
      alert(err.message || "Failed to verify");
    }
  }, []);

  const handleResolve = useCallback(async (id: number) => {
    try {
      const updated = await api.resolveIncident(id);
      setIncidents(prev => prev.map(i => i.id === id ? updated : i));
      api.getAnalytics().then(setAnalytics).catch(() => {});
      setNotification(`✅ Incident #${id} marked as resolved`);
      setTimeout(() => setNotification(null), 3500);
    } catch (err: any) {
      alert(err.message || "Failed to resolve");
    }
  }, []);

  const handleDelete = useCallback(async (id: number) => {
    if (!window.confirm(`Are you sure you want to permanently delete Incident #${id}?`)) return;
    try {
      await api.deleteIncident(id);
      setIncidents(prev => prev.filter(i => i.id !== id));
      if (activeIncident?.id === id) setActiveIncident(null);
      if (inspectIncidentTarget?.id === id) setInspectIncidentTarget(null);
      api.getAnalytics().then(setAnalytics).catch(() => {});
      setNotification(`Incident #${id} successfully deleted`);
      setTimeout(() => setNotification(null), 3500);
    } catch (err: any) {
      alert(err.message || "Failed to delete incident");
    }
  }, [activeIncident, inspectIncidentTarget]);

  const handleDeleteImage = useCallback(async (id: number) => {
    if (!window.confirm(`Are you sure you want to remove the image for Incident #${id}?`)) return;
    try {
      await api.deleteIncidentImage(id);
      setIncidents(prev =>
        prev.map(inc => (inc.id === id ? { ...inc, image_url: null } : inc))
      );
      if (inspectIncidentTarget?.id === id) {
        setInspectIncidentTarget(prev => (prev ? { ...prev, image_url: null } : null));
      }
      setNotification(`Photo evidence removed for Incident #${id}`);
      setTimeout(() => setNotification(null), 3500);
    } catch (err: any) {
      alert(err.message || "Failed to remove incident image");
    }
  }, [inspectIncidentTarget]);

  const handleExport = useCallback(() => {
    const rows = ["ID,Type,Severity,Ward,Location,Lat,Lng,Verified,Resolved,Timestamp"];
    incidents.forEach(i => {
      rows.push(`${i.id},"${i.type}",${i.severity},"${i.ward}","${i.location}",${i.lat},${i.lng},${i.verified},${i.resolved},"${i.timestamp_label}"`);
    });
    const blob = new Blob([rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `CityEye_Vidisha_Audit_${new Date().toLocaleDateString("en-IN").replace(/\//g,"-")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setExportToast(true);
    setTimeout(() => setExportToast(false), 3000);
  }, [incidents]);

  const toggleLayer = useCallback((layer: "heatmap" | "fleet" | "potholes" | "busLane") => {
    setMapLayers(prev => ({ ...prev, [layer]: !prev[layer] }));
  }, []);

  return (
    <div className="min-h-screen bg-[#080c14] text-slate-200 flex flex-col antialiased">
      {/* Toast Notifications */}
      {exportToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[99999] bg-[#0d1424] border border-sky-500/40 rounded px-4 py-2 text-sky-300 font-semibold text-xs shadow-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-sky-400" />
          <span>Vidisha Municipal Telemetry CSV successfully exported</span>
        </div>
      )}
      {notification && (
        <div className="fixed top-14 right-4 z-[99998] bg-[#140e14] border border-red-500/40 rounded px-3.5 py-2 text-xs text-red-200 shadow-xl max-w-sm fade-in-up">
          <p className="font-bold text-white flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span>{notification}</span>
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5 font-mono">Vidisha Municipal Telemetry Network</p>
        </div>
      )}

      {/* Enterprise Top Navigation */}
      <Navbar
        onExport={handleExport}
        onReport={() => setShowReport(true)}
        analytics={analytics}
        user={user}
        onLoginClick={() => setShowLogin(true)}
        onLogout={() => {
          api.logout();
          setUser(null);
        }}
        onOpenShowcase={() => setShowShowcase(true)}
        onOpenCitizenPortal={() => setShowCitizenPortal(true)}
        onOpenPDI={() => setShowPDIModal(true)}
        onOpenExecutiveReport={() => setShowExecReport(true)}
        onOpenSafeRoute={() => setShowSafeRouteModal(true)}
        onOpenDashcam={() => setShowDashcamModal(true)}
        onOpenKarma={() => setShowKarmaModal(true)}
        onOpenAnalytics={() => setShowAnalyticsModal(true)}
      />

      {/* Secondary Status Bar / Telemetry Ribbon */}
      <EnvironmentalBar />

      {/* Main Command Center Workstation */}
      <main className="flex-1 px-3 lg:px-6 py-3 flex flex-col">
        {/* Mobile & Tablet Tab Toggle Bar */}
        <div className="lg:hidden flex items-center bg-[#0d1424] border border-white/10 rounded p-1 mb-2.5">
          <button
            onClick={() => setMobileTab("map")}
            className={`flex-1 py-1.5 text-xs font-bold rounded transition-colors ${
              mobileTab === "map" ? "bg-sky-600 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            🗺️ GIS Command Map
          </button>
          <button
            onClick={() => setMobileTab("feed")}
            className={`flex-1 py-1.5 text-xs font-bold rounded transition-colors ${
              mobileTab === "feed" ? "bg-sky-600 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            🚨 Incident Queue ({incidents.filter(i => !i.resolved && i.image_url).length})
          </button>
        </div>

        {/* Two-Column Operational Split Layout - Responsive for All Laptop Widths */}
        <div className="flex-1 flex flex-col lg:flex-row gap-3 min-h-[460px] lg:min-h-[500px]">
          {/* Left / Center: Large GIS Map + Analytics Panel */}
          <div className={`flex-1 min-w-0 flex flex-col gap-3 ${mobileTab === "feed" ? "hidden lg:flex" : "flex"}`}>
            <div className="flex-1 min-h-[380px] lg:min-h-[440px]">
              <MapView
                incidents={incidents}
                activeIncident={activeIncident}
                onMarkerClick={handleSelectIncident}
                mapLayers={mapLayers}
                onToggleLayer={toggleLayer}
                activeRoute={activeSafeRoute}
                onClearRoute={() => setActiveSafeRoute(null)}
                onInspectIncident={(inc) => setInspectIncidentTarget(inc)}
              />
            </div>
            <AnalyticsPanel
              analytics={analytics}
              onExpand={() => setShowAnalyticsModal(true)}
            />
          </div>

          {/* Right: Live Incident Feed (Responsive Width for 1024px, 1280px, 1366px, 1440px, 1600px+ Laptops) */}
          <div className={`w-full lg:w-[340px] xl:w-[380px] 2xl:w-[420px] shrink-0 flex flex-col ${mobileTab === "map" ? "hidden lg:flex" : "flex"}`}>
            <div className="sticky top-16 flex flex-col h-auto lg:h-[calc(100vh-6.5rem)] min-h-[460px] lg:min-h-[500px]">
              <IncidentFeed
                incidents={incidents}
                activeId={activeIncident?.id ?? null}
                wsConnected={wsConnected}
                user={user}
                soundEnabled={soundEnabled}
                onToggleSound={() => setSoundEnabled(prev => !prev)}
                onSelect={handleSelectIncident}
                onVerify={handleVerify}
                onResolve={handleResolve}
                onDispatch={(inc) => setDispatchIncidentTarget(inc)}
                onVerifyRepair={(inc) => setVerifyIncidentTarget(inc)}
                onInspect={(inc) => setInspectIncidentTarget(inc)}
                onDelete={handleDelete}
                onOpenLogin={() => setShowLogin(true)}
              />
            </div>
          </div>
        </div>
      </main>

      {/* --- OPERATIONAL DRAWERS & MODALS --- */}

      {/* Incident Detail Drawer (Deep Inspection) */}
      <IncidentDetailDrawer
        incident={inspectIncidentTarget}
        onClose={() => setInspectIncidentTarget(null)}
        onFocusMap={(inc) => {
          setActiveIncident(inc);
          setInspectIncidentTarget(null);
        }}
        onVerify={handleVerify}
        onResolve={handleResolve}
        onDispatch={(inc) => setDispatchIncidentTarget(inc)}
        onDelete={handleDelete}
        onDeleteImage={handleDeleteImage}
        user={user}
      />

      {/* Report Modal */}
      {showReport && (
        <ReportModal onClose={() => setShowReport(false)} onCreated={loadAll} />
      )}

      {/* Login Modal */}
      {showLogin && (
        <LoginModal
          onClose={() => setShowLogin(false)}
          onSuccess={(loggedInUser) => {
            setUser(loggedInUser);
            setShowLogin(false);
          }}
        />
      )}

      {/* Project Architecture & Showcase Modal */}
      <ProjectShowcaseModal
        isOpen={showShowcase}
        onClose={() => setShowShowcase(false)}
      />

      {/* Citizen Grievance Portal Modal */}
      <CitizenPortalModal
        isOpen={showCitizenPortal}
        onClose={() => setShowCitizenPortal(false)}
        onReportSubmitted={loadAll}
      />

      {/* Corridor PDI Predictive Analytics Modal */}
      <CorridorAnalyticsModal
        isOpen={showPDIModal}
        onClose={() => setShowPDIModal(false)}
        onSelectCorridor={(coords) => {
          const matching = incidents.find(i => Math.abs(i.lat - coords[0]) < 0.05);
          if (matching) setActiveIncident(matching);
        }}
      />

      {/* Executive Municipal Audit Report Modal */}
      <ExecutiveReportModal
        isOpen={showExecReport}
        onClose={() => setShowExecReport(false)}
      />

      {/* Contractor Before/After Proof of Work Verification Modal */}
      {verifyIncidentTarget && (
        <RepairVerificationModal
          incident={verifyIncidentTarget}
          isOpen={!!verifyIncidentTarget}
          onClose={() => setVerifyIncidentTarget(null)}
          onVerificationComplete={(result) => {
            loadAll();
            setNotification(`✅ Repair Verified: ${result.repair_quality_score}% Quality Score!`);
            setTimeout(() => setNotification(null), 4000);
          }}
        />
      )}

      {/* Safe-Route Hazard-Aware Navigation Modal */}
      <SafeRouteModal
        isOpen={showSafeRouteModal}
        onClose={() => setShowSafeRouteModal(false)}
        onApplyRouteToMap={(route) => {
          setActiveSafeRoute(route);
          setNotification(`🧭 Safe Route Applied: ${route.safest_route.smoothness_score}% Smoothness!`);
          setTimeout(() => setNotification(null), 4000);
        }}
      />

      {/* Live Transit Fleet Edge AI Dashcam Stream Modal */}
      <LiveDashcamModal
        isOpen={showDashcamModal}
        onClose={() => setShowDashcamModal(false)}
        onSnapshotReport={() => {
          setShowDashcamModal(false);
          setShowReport(true);
        }}
      />

      {/* Civic Karma & Citizen Rewards Leaderboard Modal */}
      <CivicKarmaModal
        isOpen={showKarmaModal}
        onClose={() => setShowKarmaModal(false)}
      />

      {/* Municipal Ward & SLA Intelligence Modal */}
      <WardAnalyticsModal
        isOpen={showAnalyticsModal}
        onClose={() => setShowAnalyticsModal(false)}
        analytics={analytics}
        onRefresh={loadAll}
      />

      {/* Contractor SLA Work Order Modal */}
      {dispatchIncidentTarget && (
        <WorkOrderModal
          incident={dispatchIncidentTarget}
          isOpen={!!dispatchIncidentTarget}
          onClose={() => setDispatchIncidentTarget(null)}
          onDispatched={loadAll}
        />
      )}
    </div>
  );
}
