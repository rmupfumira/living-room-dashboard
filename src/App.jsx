import { useRef, useState } from "react";
import { useHA } from "./ha/HaContext";
import Rail from "./components/Rail";
import TopClock from "./components/TopClock";
import TopWeather from "./components/TopWeather";
import TopAlerts from "./components/TopAlerts";
import SecurityCard from "./components/SecurityCard";
import SecurityDrawer from "./components/SecurityDrawer";
import CamerasCard from "./components/CamerasCard";
import KitchenCard from "./components/KitchenCard";
import SolarCard from "./components/SolarCard";
import MediaCard from "./components/MediaCard";
import ClimateCard from "./components/ClimateCard";
import ScenesBar from "./components/ScenesBar";
import Toast from "./components/Toast";
import OfflineOverlay from "./components/OfflineOverlay";

/**
 * Luxury Gold kitchen command center — v2 (hierarchy redesign).
 *
 *   TOP    Clock · Weather (current + 3-day) · Alerts          (highest priority)
 *   MID    [Security compact + Cameras single] · Lighting hero (secondary)
 *   LOWER  Solar · Media · Air Conditioner                     (tertiary)
 *   FOOT   Scenes (elevated quick actions)
 *
 * Security device detail lives in a slide-out drawer.
 */
export default function App() {
  const { status, error, retry } = useHA();
  const [view, setView] = useState("kitchen");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  const fireToast = (icon, msg) => {
    setToast({ icon, msg });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2200);
  };

  const railPick = (id, label) => {
    if (id === "kitchen") setView(id);
    else fireToast("sparkles", `${label} — coming soon`);
  };

  return (
    <div className="lux-app">
      <Rail view={view} onPick={railPick} />

      <div className="lux-main">
        <div className="lux-top">
          <TopClock />
          <TopWeather />
          <TopAlerts />
        </div>

        <div className="lux-mid">
          <div className="mid-left">
            <SecurityCard onToast={fireToast} onDetails={() => setDrawerOpen(true)} />
            <CamerasCard />
          </div>
          <KitchenCard onToast={fireToast} />
        </div>

        <div className="lux-low">
          <SolarCard />
          <MediaCard onToast={fireToast} />
          <ClimateCard onToast={fireToast} />
        </div>

        <ScenesBar onToast={fireToast} />
      </div>

      <SecurityDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} onToast={fireToast} />
      <Toast toast={toast} />
      <OfflineOverlay status={status} error={error} onRetry={retry} />
    </div>
  );
}
