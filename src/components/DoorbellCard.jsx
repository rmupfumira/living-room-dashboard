import { DoorOpen, LockOpen, Mic, X } from "lucide-react";
import Led from "./Led";

/**
 * Doorbell card — switches between two states.
 *
 *   ringing  → argon glow frame, pulsing "RINGING" status, "visitor at the door"
 *              copy, and Unlock / Talk / × buttons that all clear the ring.
 *   idle     → muted status, last-ring memory, same buttons (still callable).
 */
export default function DoorbellCard({ doorbell, ringing, onUnlock, onTalk, onDismiss }) {
  return (
    <div className={"card rise doorbell" + (ringing ? " ringing" : "")} style={{ gridColumn: "span 6" }}>
      <div className="card-head">
        <div className="card-ic">
          <DoorOpen size={16} strokeWidth={2} />
        </div>
        <div>
          <div className="card-title">{doorbell.name}</div>
          <div className="card-sub mlabel">{doorbell.location}</div>
        </div>
        <div className="spacer" />
        <Led tone={ringing ? "on" : "default"} pulse={ringing} />
      </div>

      <div className="db-status">
        <span className="mlabel">{ringing ? "Ringing" : "Idle"}</span>
      </div>
      <div className="db-msg">
        {ringing ? "Visitor at the door" : "No active call"}
      </div>
      <div className="db-sub">
        {ringing ? "Live 1080p · two-way audio ready" : `Last ring · ${doorbell.lastRing}`}
      </div>

      <div className="db-btns">
        <button type="button" className="db-btn primary" onClick={onUnlock}>
          <LockOpen size={15} strokeWidth={2} />
          Unlock
        </button>
        <button type="button" className="db-btn" onClick={onTalk}>
          <Mic size={15} strokeWidth={2} />
          Talk
        </button>
        <button type="button" className="db-btn ghost" onClick={onDismiss} aria-label="Dismiss">
          <X size={15} strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}
