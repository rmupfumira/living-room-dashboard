import { ShieldCheck, ShieldAlert, Lock, ChevronRight } from "lucide-react";
import { ENTITIES } from "../entities";
import { useEntity } from "../ha/HaContext";
import { useService } from "../ha/useService";

/**
 * Compact security status card (correction 1).
 * Shows only: secure status · Secure Home button · View Details.
 * The full sensor/door list lives in the slide-out drawer (onDetails).
 */
export default function SecurityCard({ onToast, onDetails }) {
  const garage = useEntity(ENTITIES.security.garage);
  const gate = useEntity(ENTITIES.security.gate);
  const outdoor = useEntity(ENTITIES.security.outdoorAlarm);
  const indoor = useEntity(ENTITIES.security.indoorAlarm);
  const entArea = useEntity(ENTITIES.security.entArea);
  const screen = useEntity(ENTITIES.security.screenGate);
  const call = useService();

  const isOpen = (e) => e && /^(open|opening)$/i.test(e.state);
  const isArmed = (e) => e && /^armed/i.test(e.state);
  const isLocked = (e) => e && e.state === "locked";

  const armed = isArmed(outdoor) && isArmed(indoor);
  const allClosed = !isOpen(garage) && !isOpen(gate) && !isOpen(screen) && isLocked(entArea);
  const secure = armed && allClosed;

  // count anything that needs attention for the subtitle
  const openCount =
    (isOpen(garage) ? 1 : 0) + (isOpen(gate) ? 1 : 0) + (isOpen(screen) ? 1 : 0) + (!isLocked(entArea) ? 1 : 0);

  const secureHome = () => {
    onToast?.("shield-check", "Securing home…");
    call("script", "turn_on", {}, { entity_id: ENTITIES.security.secureHomeScript });
  };

  const statusClass = secure ? "secure" : "alert";
  const StatusIcon = secure ? ShieldCheck : ShieldAlert;

  return (
    <div className="sec-compact rise">
      <div className={"sec-status " + statusClass}>
        <div className="sec-shield">
          <StatusIcon size={26} strokeWidth={2} />
        </div>
        <div>
          <div className="sec-status-t">{secure ? "Home Secure" : "Attention"}</div>
          <div className="sec-status-s">
            {secure ? (
              <>All systems <b>armed</b></>
            ) : armed ? (
              <><b>{openCount}</b> {openCount === 1 ? "door open" : "doors open"}</>
            ) : (
              <><b>Partially</b> disarmed</>
            )}
          </div>
        </div>
      </div>

      <div className="sec-actions">
        <button type="button" className="secure-btn" onClick={secureHome}>
          <Lock size={15} strokeWidth={2.2} />
          Secure Home
        </button>
        <button type="button" className="details-btn" onClick={onDetails}>
          Details
          <ChevronRight size={15} strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}
