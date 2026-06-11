import { useEffect, useMemo, useState } from "react";
import { LockOpen, Lock, Mic, X, DoorOpen, Camera as CameraIcon } from "lucide-react";
import Led from "./Led";
import { ENTITIES } from "../entities";
import { useEntity } from "../ha/HaContext";
import { useService, haAuthUrl } from "../ha/useService";

export default function DoorbellCard({ onToast }) {
  const ringingFlag = useEntity(ENTITIES.doorbell.ringing);
  const ringSensor = useEntity(ENTITIES.doorbell.ring);
  const lock = useEntity(ENTITIES.doorbell.lock);
  const cam = useEntity(ENTITIES.doorbell.camera);
  const call = useService();

  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // Reload the camera snapshot every 5s so the feed feels live.
  // (For full HLS streaming we'd attach to /api/camera_proxy_stream — a follow-up.)
  const [snapTick, setSnapTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setSnapTick((t) => t + 1), 5000);
    return () => clearInterval(id);
  }, []);

  const camPath = cam?.attributes?.entity_picture;
  const snapSrc = useMemo(() => {
    if (!camPath) return "";
    const url = haAuthUrl(camPath);
    return url + (url.includes("?") ? "&" : "?") + "t=" + snapTick;
  }, [camPath, snapTick]);

  const ringing = ringingFlag?.state === "on" || ringSensor?.state === "on";
  const isLocked = lock?.state === "locked";
  const lockUnavail = !lock || lock.state === "unavailable";

  const unlock = async () => {
    onToast?.("lock-open", "Front door unlocked");
    await call("input_boolean", "turn_off", {}, { entity_id: ENTITIES.doorbell.ringing });
    await call("lock", "unlock", {}, { entity_id: ENTITIES.doorbell.lock });
  };
  const toggleLock = async () => {
    if (lockUnavail) return;
    onToast?.(isLocked ? "lock-open" : "lock", isLocked ? "Door unlocked" : "Door locked");
    await call("lock", isLocked ? "unlock" : "lock", {}, { entity_id: ENTITIES.doorbell.lock });
  };
  const dismiss = async () => {
    onToast?.("bell-off", "Doorbell dismissed");
    await call("input_boolean", "turn_off", {}, { entity_id: ENTITIES.doorbell.ringing });
  };
  const snapshot = async () => {
    onToast?.("camera", "Snapshot saved");
    await call(
      "camera",
      "snapshot",
      { filename: "/config/www/snapshots/doorbell_{{ now().strftime('%Y%m%d_%H%M%S') }}.jpg" },
      { entity_id: ENTITIES.doorbell.camera }
    );
  };

  const clock = now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const camName = cam?.attributes?.friendly_name || "Front Door";

  return (
    <div className="span-doorbell" style={{ gridColumn: "span 8" }}>
      <div className={"card rise doorbell" + (ringing ? " ringing" : "")}>
        <div className="db-feed">
          {snapSrc ? (
            <img src={snapSrc} alt={camName} onError={(e) => { e.currentTarget.style.display = "none"; }} />
          ) : (
            <div className="db-feed-fallback">Feed · {camName}</div>
          )}
          <div className="db-overlay">
            <div className="db-top-row">
              <div className="db-pills">
                <span className="glass-pill live">
                  <Led tone="alert" pulse />
                  REC
                </span>
                <span className="glass-pill">HD</span>
              </div>
              <span className="glass-pill">{clock}</span>
            </div>
            <div className="db-bottom-row">
              <div>
                <div className="db-name">{camName}</div>
                <div className="db-loc">Porch · {cam?.attributes?.brand || "UniFi"}</div>
              </div>
              <span className="glass-pill">1080P</span>
            </div>
          </div>
        </div>

        <div className="db-actions">
          {ringing && (
            <div className="db-banner">
              <Led tone="on" pulse />
              <span>Someone's at the door</span>
              <div style={{ flex: 1 }} />
              <button type="button" className="alert-dismiss" onClick={dismiss} aria-label="Dismiss">
                <X size={14} strokeWidth={2} />
              </button>
            </div>
          )}

          <div className="db-lock-row">
            <div style={{ width: 30, color: isLocked ? "var(--green)" : "var(--red)" }}>
              {isLocked ? <Lock size={18} strokeWidth={2} /> : <LockOpen size={18} strokeWidth={2} />}
            </div>
            <div className="lock-info">
              <div className="lock-label">Front Door · {isLocked ? "Locked" : lockUnavail ? "Unknown" : "Unlocked"}</div>
              <div className="mlabel" style={{ marginTop: 2 }}>
                {lockUnavail ? "Entity unavailable" : "Tap the toggle to lock/unlock"}
              </div>
            </div>
            <button
              type="button"
              className="chip"
              onClick={toggleLock}
              disabled={lockUnavail}
              style={lockUnavail ? { opacity: 0.4, pointerEvents: "none" } : undefined}
            >
              {isLocked ? "Unlock" : "Lock"}
            </button>
          </div>

          <div className="db-btns">
            <button type="button" className="db-btn primary" onClick={unlock} disabled={lockUnavail}>
              <DoorOpen size={16} strokeWidth={2} />
              Open for Visitor
            </button>
            <button type="button" className="db-btn" onClick={snapshot}>
              <CameraIcon size={16} strokeWidth={2} />
              Snapshot
            </button>
            <button type="button" className="db-btn ghost" aria-label="Talk" title="Two-way audio">
              <Mic size={16} strokeWidth={2} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
