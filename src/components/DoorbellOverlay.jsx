import { useEffect, useMemo, useState } from "react";
import { Bell, DoorOpen, X } from "lucide-react";
import Led from "./Led";
import { ENTITIES } from "../entities";
import { useEntity } from "../ha/HaContext";
import { useService, haAuthUrl } from "../ha/useService";

/**
 * Full-screen doorbell takeover. Appears whenever input_boolean.doorbell_ringing
 * is on, showing the front-door camera big with two choices:
 *   Ignore           → clear the ring, do nothing
 *   Allow visitor in → unlock the front door, then clear the ring
 */
export default function DoorbellOverlay({ onToast }) {
  const ringing = useEntity(ENTITIES.doorbell.ringing);
  const cam = useEntity(ENTITIES.doorbell.camera);
  const call = useService();
  const [tick, setTick] = useState(0);

  const active = ringing?.state === "on";

  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setTick((t) => t + 1), 1000); // near-live snapshot
    return () => clearInterval(id);
  }, [active]);

  const path = cam?.attributes?.entity_picture;
  const src = useMemo(() => {
    if (!path) return "";
    const u = haAuthUrl(path);
    return u + (u.includes("?") ? "&" : "?") + "t=" + tick;
  }, [path, tick]);

  if (!active) return null;

  const clearRing = () => call("input_boolean", "turn_off", {}, { entity_id: ENTITIES.doorbell.ringing });
  const ignore = () => {
    onToast?.("bell", "Doorbell dismissed");
    clearRing();
  };
  const allow = () => {
    onToast?.("door-open", "Front door unlocked — come in");
    call("lock", "unlock", {}, { entity_id: ENTITIES.doorbell.lock });
    clearRing();
  };

  return (
    <div className="db-overlay" role="dialog" aria-label="Doorbell">
      <div className="db-head">
        <Bell size={22} strokeWidth={2} />
        <span>Visitor at the front door</span>
      </div>

      <div className="db-cam">
        {src ? (
          <img src={src} alt="Front door" onError={(e) => { e.currentTarget.style.display = "none"; }} />
        ) : (
          <div className="cam-fallback">Front Door camera</div>
        )}
        <span className="cam-live-pill"><Led tone="critical" pulse />LIVE</span>
      </div>

      <div className="db-actions">
        <button type="button" className="db-btn ignore" onClick={ignore}>
          <X size={22} strokeWidth={2.4} /> Ignore
        </button>
        <button type="button" className="db-btn allow" onClick={allow}>
          <DoorOpen size={22} strokeWidth={2.2} /> Allow visitor in
        </button>
      </div>
    </div>
  );
}
