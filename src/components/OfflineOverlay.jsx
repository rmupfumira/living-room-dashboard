import { AlertTriangle, RefreshCw } from "lucide-react";
import { HA_URL } from "../ha/client";

export default function OfflineOverlay({ status, error, onRetry }) {
  if (status === "connected") return null;
  const connecting = status === "connecting" || status === "idle";
  return (
    <div className="offline-overlay" role="alertdialog" aria-live="assertive">
      <div className="offline-panel">
        <div className="offline-ic">
          <AlertTriangle size={30} strokeWidth={2} />
        </div>
        <div className="mlabel" style={{ color: connecting ? "var(--warn)" : "var(--red)" }}>
          {connecting ? "Reconnecting" : "Home Assistant offline"}
        </div>
        <h2 className="offline-title">
          {connecting ? "Linking to Home Assistant…" : "Lost link to Home Assistant"}
        </h2>
        <p className="offline-sub">
          {error || "The dashboard cannot reach your Home Assistant instance right now."}
        </p>
        <div className="offline-meta">
          <span className="mlabel">Endpoint</span>
          <code>{HA_URL || "(unset)"}</code>
        </div>
        <button type="button" className="offline-retry" onClick={onRetry}>
          <RefreshCw size={15} strokeWidth={2} />
          Retry now
        </button>
      </div>
    </div>
  );
}
