import { useEffect, useState } from "react";
import { Bell, Sun, RefreshCw } from "lucide-react";
import { fmtTime } from "../lib/format";
import Led from "./Led";

/**
 * Hard reload — clears any service-worker caches + busts the URL so the
 * wall-panel Chromium drops stale assets after a deploy. Saves a Pi
 * keyboard trip when the dashboard doesn't refresh on its own.
 */
async function hardReload() {
  try {
    if ("caches" in window) {
      const names = await caches.keys();
      await Promise.all(names.map((n) => caches.delete(n)));
    }
    if ("serviceWorker" in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.unregister()));
    }
  } catch {
    /* best-effort */
  }
  const url = new URL(window.location.href);
  url.searchParams.set("_nc", String(Date.now()));
  window.location.replace(url.toString());
}

/**
 * Aurora header — greeting, sysline, clock (mono HH:MM:SS), bell.
 * Connection status is reflected in the sysline LED + copy.
 */
const STATUS_COPY = {
  connected: { tone: "success", text: "All systems nominal" },
  connecting: { tone: "warn", text: "Linking to Home Assistant…" },
  error: { tone: "alert", text: "Home Assistant offline" },
  idle: { tone: "warn", text: "Linking to Home Assistant…" },
};

export default function Header({ haStatus = "connecting", notifCount = 0 }) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  const t = fmtTime(now);
  const stat = STATUS_COPY[haStatus] || STATUS_COPY.idle;

  return (
    <header className="header">
      <div className="greet">
        <h1>
          Good <span className="accent">to see you</span>
        </h1>
        <div className="sysline">
          <Led tone={stat.tone} pulse={haStatus === "connected"} />
          <span className="mlabel">{stat.text}</span>
        </div>
      </div>

      <div className="clock" aria-live="polite">
        <span className="clock-hm">{t.slice(0, 5)}</span>
        <span className="clock-s">:{t.slice(6)}</span>
      </div>

      <div className="header-right">
        <button type="button" className="icon-btn" aria-label="Theme">
          <Sun size={18} strokeWidth={2} />
        </button>
        <button
          type="button"
          className="icon-btn"
          aria-label={`Notifications (${notifCount})`}
          title={`${notifCount} active`}
        >
          <Bell size={18} strokeWidth={2} />
          {notifCount > 0 && <span className="ping" />}
        </button>
        <button
          type="button"
          className="icon-btn subtle"
          onClick={hardReload}
          aria-label="Hard reload"
          title="Hard reload (clear cache)"
        >
          <RefreshCw size={15} strokeWidth={2} />
        </button>
      </div>
    </header>
  );
}
