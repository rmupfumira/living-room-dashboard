import { AlertTriangle, Warehouse, ShieldOff, Fence, Unlock } from "lucide-react";
import { ENTITIES } from "../entities";
import { useEntity } from "../ha/HaContext";

/**
 * After-dark "not secured" flag. Once the sun is below the horizon, if any of
 * the key perimeter entities are left insecure — garage open, outdoor alarm
 * disarmed, screen gate open, entertainment-area door unlocked — a big, bold,
 * pulsing red banner is pinned to the top of the screen so it reads from across
 * the room. It sits above the screensaver (z-index) with pointer-events: none,
 * so it shows on the idle clock too and never blocks a wake-tap.
 *
 * Suppressed during Guest Mode (the app already treats guest mode as
 * "security paused" — see the screensaver's guest chip).
 */
export default function SecurityFlag() {
  const sun = useEntity(ENTITIES.sun);
  const guest = useEntity(ENTITIES.guestMode);
  const garage = useEntity(ENTITIES.security.garage);
  const outdoor = useEntity(ENTITIES.security.outdoorAlarm);
  const screenGate = useEntity(ENTITIES.security.screenGate);
  const entArea = useEntity(ENTITIES.security.entArea);

  const afterDark = sun?.state === "below_horizon";
  if (!afterDark || guest?.state === "on") return null;

  const issues = [
    garage?.state === "open" && { key: "garage", Icon: Warehouse, label: "Garage open" },
    outdoor?.state === "disarmed" && { key: "outdoorAlarm", Icon: ShieldOff, label: "Outdoor alarm off" },
    screenGate?.state === "open" && { key: "screenGate", Icon: Fence, label: "Screen gate open" },
    entArea?.state === "unlocked" && { key: "entArea", Icon: Unlock, label: "Ent. area unlocked" },
  ].filter(Boolean);
  if (issues.length === 0) return null;

  return (
    <div className="secflag" role="alert" aria-live="assertive">
      <div className="secflag-head">
        <AlertTriangle size={40} strokeWidth={2.4} />
        Not secured after dark
      </div>
      <div className="secflag-items">
        {issues.map(({ key, Icon, label }) => (
          <div className="secflag-item" key={key}>
            <Icon size={30} strokeWidth={2.2} />
            <span>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
