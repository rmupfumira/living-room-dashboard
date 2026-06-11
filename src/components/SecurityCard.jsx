import { ShieldCheck, Siren, Shield, Warehouse, Fence, DoorClosed, DoorOpen } from "lucide-react";
import Led from "./Led";
import { ENTITIES } from "../entities";
import { useEntity } from "../ha/HaContext";
import { useService } from "../ha/useService";

/** Single security row — clickable, gradient when on/armed. */
function SecRow({ icon: Icon, name, ent, onLabel, offLabel, busy, unavail, onClick }) {
  const cls = busy ? " on armed" : unavail ? " sec-unavail" : "";
  const ledTone = busy ? "on" : "default";
  return (
    <div
      className={"sec-row" + cls}
      onClick={unavail ? undefined : onClick}
      role="button"
      tabIndex={unavail ? -1 : 0}
      onKeyDown={(e) => {
        if ((e.key === "Enter" || e.key === " ") && !unavail) onClick();
      }}
    >
      <div className="sec-ic">
        <Icon size={18} strokeWidth={2} />
      </div>
      <div className="sec-meta">
        <div className="sec-name">{name}</div>
        <div className="sec-state">
          {unavail ? "Unavailable" : busy ? onLabel : offLabel}
        </div>
      </div>
      <Led tone={ledTone} />
    </div>
  );
}

export default function SecurityCard({ onToast }) {
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
  const unavail = (e) => !e || e.state === "unavailable";

  const toggleCover = async (slot, ent, openMsg, closeMsg, icon) => {
    const open = isOpen(ent);
    onToast?.(icon, open ? closeMsg : openMsg);
    await call("cover", open ? "close_cover" : "open_cover", {}, { entity_id: ENTITIES.security[slot] });
  };

  const toggleAlarm = async (slot, ent, armMsg, disarmMsg, icon) => {
    const armed = isArmed(ent);
    onToast?.(icon, armed ? disarmMsg : armMsg);
    await call(
      "alarm_control_panel",
      armed ? "alarm_disarm" : "alarm_arm_away",
      {},
      { entity_id: ENTITIES.security[slot] }
    );
  };

  const toggleLock = async (slot, ent, lockMsg, unlockMsg, icon) => {
    const locked = isLocked(ent);
    onToast?.(icon, locked ? unlockMsg : lockMsg);
    await call("lock", locked ? "unlock" : "lock", {}, { entity_id: ENTITIES.security[slot] });
  };

  const secureHome = async () => {
    onToast?.("shield-check", "Securing home…");
    await call("script", "turn_on", {}, { entity_id: ENTITIES.security.secureHomeScript });
  };

  return (
    <div className="span-security" style={{ gridColumn: "span 4" }}>
      <div className="card rise">
        <div className="card-head">
          <div className="card-ic" style={{ color: "var(--purple)" }}>
            <Shield size={18} strokeWidth={2} />
          </div>
          <div>
            <div className="card-title">Security</div>
            <div className="card-sub mlabel">Whole home</div>
          </div>
        </div>

        <div className="security-list">
          <SecRow
            icon={Warehouse}
            name="Garage Door"
            ent={garage}
            onLabel="Open"
            offLabel="Closed"
            busy={isOpen(garage)}
            unavail={unavail(garage)}
            onClick={() => toggleCover("garage", garage, "Garage opening", "Garage closing", "warehouse")}
          />
          <SecRow
            icon={Fence}
            name="Front Gate"
            ent={gate}
            onLabel="Open"
            offLabel="Closed"
            busy={isOpen(gate)}
            unavail={unavail(gate)}
            onClick={() => toggleCover("gate", gate, "Gate opening", "Gate closing", "fence")}
          />
          <SecRow
            icon={Siren}
            name="Outdoor Alarm"
            ent={outdoor}
            onLabel="Armed"
            offLabel="Disarmed"
            busy={isArmed(outdoor)}
            unavail={unavail(outdoor)}
            onClick={() => toggleAlarm("outdoorAlarm", outdoor, "Outdoor alarm armed", "Outdoor alarm disarmed", "siren")}
          />
          <SecRow
            icon={Shield}
            name="Indoor Alarm"
            ent={indoor}
            onLabel="Armed"
            offLabel="Disarmed"
            busy={isArmed(indoor)}
            unavail={unavail(indoor)}
            onClick={() => toggleAlarm("indoorAlarm", indoor, "Indoor alarm armed", "Indoor alarm disarmed", "shield")}
          />
        </div>

        <div className="mlabel sec-section-title">Doors</div>
        <div className="security-list">
          <SecRow
            icon={isLocked(entArea) ? DoorClosed : DoorOpen}
            name="Entertainment Area"
            ent={entArea}
            onLabel="Unlocked"
            offLabel="Locked"
            busy={!isLocked(entArea) && !unavail(entArea)}
            unavail={unavail(entArea)}
            onClick={() => toggleLock("entArea", entArea, "Ent Area locked", "Ent Area unlocked", "lock")}
          />
          <SecRow
            icon={isOpen(screen) ? DoorOpen : DoorClosed}
            name="Screen Gate"
            ent={screen}
            onLabel="Open"
            offLabel="Closed"
            busy={isOpen(screen)}
            unavail={unavail(screen)}
            onClick={() => toggleCover("screenGate", screen, "Screen gate opening", "Screen gate closing", "door-open")}
          />
        </div>

        <button type="button" className="secure-home-btn" onClick={secureHome}>
          <ShieldCheck size={16} strokeWidth={2.4} />
          Secure Home
        </button>
      </div>
    </div>
  );
}
