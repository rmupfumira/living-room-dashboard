import { Shield, Siren, Warehouse, Fence, DoorClosed, DoorOpen, X } from "lucide-react";
import { ENTITIES } from "../entities";
import { useEntity } from "../ha/HaContext";
import { useService } from "../ha/useService";
import { useConfirm } from "./Confirm";

/** A single tappable device row inside the drawer. */
function Row({ Icon, name, status, alerting, unavail, onClick }) {
  return (
    <div
      className={"sec-item" + (alerting ? " alert-state" : "") + (unavail ? " unavail" : "")}
      onClick={unavail ? undefined : onClick}
      role="button"
      tabIndex={unavail ? -1 : 0}
      onKeyDown={(e) => {
        if ((e.key === "Enter" || e.key === " ") && !unavail) onClick();
      }}
    >
      <div className="sec-item-ic">
        <Icon size={21} strokeWidth={2} />
      </div>
      <div className="sec-item-meta">
        <div className="sec-item-n">{name}</div>
        <div className="sec-item-s">{unavail ? "Unavailable" : status}</div>
      </div>
    </div>
  );
}

/**
 * Slide-out drawer with the full security device list (correction 1).
 * Opened from the compact SecurityCard's "Details" button.
 */
export default function SecurityDrawer({ open, onClose, onToast }) {
  const garage = useEntity(ENTITIES.security.garage);
  const gate = useEntity(ENTITIES.security.gate);
  const outdoor = useEntity(ENTITIES.security.outdoorAlarm);
  const indoor = useEntity(ENTITIES.security.indoorAlarm);
  const entArea = useEntity(ENTITIES.security.entArea);
  const screen = useEntity(ENTITIES.security.screenGate);
  const call = useService();
  const confirm = useConfirm();

  if (!open) return null;

  const isOpen = (e) => e && /^(open|opening)$/i.test(e.state);
  const isArmed = (e) => e && /^armed/i.test(e.state);
  const isLocked = (e) => e && e.state === "locked";
  const unavail = (e) => !e || e.state === "unavailable";

  // Confirm the security-reducing direction (open / disarm / unlock); the
  // securing direction (close / arm / lock) stays one-tap.
  const guard = async (critical, verb, name) => {
    if (!critical) return true;
    return confirm({
      title: `${verb} ${name}?`,
      message: `This will ${verb.toLowerCase()} ${name.toLowerCase()} and reduce your home security.`,
      confirmLabel: verb,
      danger: true,
    });
  };

  const toggleCover = async (slot, ent, name) => {
    const o = isOpen(ent);
    if (!(await guard(!o, "Open", name))) return;
    onToast?.("shield", o ? `${name} closing` : `${name} opening`);
    call("cover", o ? "close_cover" : "open_cover", {}, { entity_id: ENTITIES.security[slot] });
  };
  const toggleAlarm = async (slot, ent, name) => {
    const ar = isArmed(ent);
    if (!(await guard(ar, "Disarm", name))) return;
    onToast?.("shield", ar ? `${name} disarmed` : `${name} armed`);
    call("alarm_control_panel", ar ? "alarm_disarm" : "alarm_arm_away", {}, { entity_id: ENTITIES.security[slot] });
  };
  const toggleLock = async (slot, ent, name) => {
    const l = isLocked(ent);
    if (!(await guard(l, "Unlock", name))) return;
    onToast?.("lock", l ? `${name} unlocked` : `${name} locked`);
    call("lock", l ? "unlock" : "lock", {}, { entity_id: ENTITIES.security[slot] });
  };

  return (
    <>
      <div className="drawer-backdrop" onClick={onClose} />
      <aside className="drawer" role="dialog" aria-label="Security details">
        <div className="drawer-head">
          <Shield size={22} strokeWidth={2} color="var(--gold)" />
          <h2>Security &amp; Access</h2>
          <button type="button" className="drawer-close" onClick={onClose} aria-label="Close">
            <X size={20} strokeWidth={2} />
          </button>
        </div>
        <div className="drawer-list">
          <Row Icon={Warehouse} name="Garage Door" status={isOpen(garage) ? "Open" : "Closed"} alerting={isOpen(garage)} unavail={unavail(garage)} onClick={() => toggleCover("garage", garage, "Garage Door")} />
          <Row Icon={Fence} name="Front Gate" status={isOpen(gate) ? "Open" : "Closed"} alerting={isOpen(gate)} unavail={unavail(gate)} onClick={() => toggleCover("gate", gate, "Front Gate")} />
          <Row Icon={Siren} name="Outdoor Alarm" status={isArmed(outdoor) ? "Armed" : "Disarmed"} alerting={!isArmed(outdoor) && !unavail(outdoor)} unavail={unavail(outdoor)} onClick={() => toggleAlarm("outdoorAlarm", outdoor, "Outdoor Alarm")} />
          <Row Icon={Shield} name="Indoor Alarm" status={isArmed(indoor) ? "Armed" : "Disarmed"} alerting={false} unavail={unavail(indoor)} onClick={() => toggleAlarm("indoorAlarm", indoor, "Indoor Alarm")} />
          <Row Icon={isLocked(entArea) ? DoorClosed : DoorOpen} name="Entertainment Door" status={isLocked(entArea) ? "Locked" : "Unlocked"} alerting={!isLocked(entArea) && !unavail(entArea)} unavail={unavail(entArea)} onClick={() => toggleLock("entArea", entArea, "Entertainment Door")} />
          <Row Icon={isOpen(screen) ? DoorOpen : DoorClosed} name="Screen Gate" status={isOpen(screen) ? "Open" : "Closed"} alerting={isOpen(screen)} unavail={unavail(screen)} onClick={() => toggleCover("screenGate", screen, "Screen Gate")} />
        </div>
      </aside>
    </>
  );
}
