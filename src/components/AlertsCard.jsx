import { AlertTriangle, ShieldCheck, X, BatteryLow, Droplets, Bell, Info } from "lucide-react";
import { useHA } from "../ha/HaContext";
import { usePersistentNotifications } from "../ha/usePersistentNotifications";
import { ALERT_SENSORS } from "../entities";

const ICON_BY_CLASS = {
  critical: AlertTriangle,
  warning: BatteryLow,
  info: Info,
  success: ShieldCheck,
};

/**
 * Classify a persistent notification or binary_sensor into our 4 severity
 * buckets. Heuristics are tuned to common HA notification_id prefixes.
 */
function classify(item) {
  const t = (item.title || "").toLowerCase();
  const id = (item.notification_id || "").toLowerCase();
  if (id.includes("alarm") || t.includes("triggered") || t.includes("breach")) return "critical";
  if (id.includes("leak") || t.includes("leak")) return "critical";
  if (id.includes("battery") || t.includes("battery")) return "warning";
  if (id.includes("update") || t.includes("update available")) return "info";
  if (id.includes("armed") || t.includes("armed")) return "success";
  return "info";
}

function iconFor(item) {
  const cls = classify(item);
  return ICON_BY_CLASS[cls] || Bell;
}

export default function AlertsCard() {
  const { entities, status } = useHA();
  const { items: persistents, dismiss, dismissAll } = usePersistentNotifications();

  // Curated binary-sensor alerts that are currently `on`.
  const sensorAlerts = ALERT_SENSORS
    .map((s) => {
      const ent = entities[s.id];
      if (!ent || ent.state !== "on") return null;
      return {
        notification_id: s.id,
        title: s.label,
        message: ent.attributes?.friendly_name || s.id,
        _class: s.class,
        _source: "sensor",
      };
    })
    .filter(Boolean);

  // Persistent notifications, classified.
  const persistentAlerts = persistents.map((p) => ({
    ...p,
    _class: classify(p),
    _source: "persistent",
  }));

  // Critical first, then warning, then info/success — and within each, sensor first.
  const order = { critical: 0, warning: 1, info: 2, success: 3 };
  const all = [...sensorAlerts, ...persistentAlerts]
    .sort((a, b) => (order[a._class] ?? 9) - (order[b._class] ?? 9))
    .slice(0, 8); // cap to keep the row tight

  if (status !== "connected") {
    return null; // OfflineOverlay handles disconnected UX
  }

  if (all.length === 0) {
    return (
      <div className="span-alerts" style={{ gridColumn: "span 12" }}>
        <div className="card rise alerts">
          <div className="alerts-quiet">
            <ShieldCheck size={18} strokeWidth={2} color="var(--green)" />
            All clear — no alerts or notifications active.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="span-alerts" style={{ gridColumn: "span 12" }}>
      <div className="card rise">
        <div className="card-head">
          <div className="card-ic" style={{ color: "var(--purple)" }}>
            <Bell size={18} strokeWidth={2} />
          </div>
          <div>
            <div className="card-title">Alerts &amp; Notifications</div>
            <div className="card-sub mlabel">{all.length} active</div>
          </div>
          <div className="spacer" />
          <button type="button" className="alerts-clear" onClick={dismissAll}>
            Clear all
          </button>
        </div>

        <div className="alerts">
          {all.map((a) => {
            const Icon = iconFor(a);
            return (
              <div key={`${a._source}:${a.notification_id}`} className={`alert-row ${a._class}`}>
                <div className="alert-ic">
                  <Icon size={16} strokeWidth={2} />
                </div>
                <div className="alert-meta">
                  <div className="alert-title">{a.title || a.notification_id}</div>
                  {a.message && <div className="alert-body">{String(a.message).slice(0, 120)}</div>}
                </div>
                {a._source === "persistent" && (
                  <button
                    type="button"
                    className="alert-dismiss"
                    onClick={() => dismiss(a.notification_id)}
                    aria-label="Dismiss"
                  >
                    <X size={14} strokeWidth={2} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
