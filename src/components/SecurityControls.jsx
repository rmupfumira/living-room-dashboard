import * as L from "lucide-react";
import { Shield, ShieldCheck, AlertTriangle, Check } from "lucide-react";
import { ENTITIES } from "../entities";
import { useEntity, useHA } from "../ha/HaContext";
import { useService } from "../ha/useService";

function toPascal(name) {
  return String(name).split(/[-_]/).map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join("");
}

/**
 * Derive the secure/label/service semantics for one control from its raw state.
 * Shared by the tile (rendering) and the card (overall "all secure" verdict).
 *   alarm → armed/disarmed   cover → open/closed   lock → locked/unlocked
 * secure === true means armed / closed / locked.
 */
function statusOf(ctl, state) {
  const unavail = !state || state === "unavailable";
  if (ctl.kind === "alarm") {
    const secure = /^armed/i.test(state || "");
    return { secure, unavail, label: secure ? "Armed" : "Disarmed" };
  }
  if (ctl.kind === "cover") {
    const open = /^(open|opening)$/i.test(state || "");
    return { secure: !open, unavail, label: open ? "Open" : "Closed" };
  }
  const locked = state === "locked";
  return { secure: locked, unavail, label: locked ? "Locked" : "Unlocked" };
}

/**
 * One security control tile. Visual state, loudest-first:
 *   alert  (amber, pulsing)  → not secure, available, not ignored — needs attention
 *   secure (calm green tint) → armed / closed / locked
 *   muted                    → unavailable, or an `ignore` tile (e.g. indoor alarm)
 */
function ControlTile({ ctl, onToast }) {
  const ent = useEntity(ctl.entity);
  const call = useService();
  const Icon = L[toPascal(ctl.icon)] || Shield;
  const { secure, unavail, label } = statusOf(ctl, ent?.state);
  const alert = !secure && !unavail && !ctl.ignore;
  const cls = unavail ? "muted" : alert ? "alert" : secure ? "secure" : "muted";

  const action = () => {
    if (ctl.kind === "alarm") {
      call("alarm_control_panel", secure ? "alarm_disarm" : "alarm_arm_away", {}, { entity_id: ctl.entity });
    } else if (ctl.kind === "cover") {
      call("cover", secure ? "open_cover" : "close_cover", {}, { entity_id: ctl.entity });
    } else {
      call("lock", secure ? "unlock" : "lock", {}, { entity_id: ctl.entity });
    }
  };

  const toggle = () => {
    if (unavail) return;
    onToast?.("shield", `${ctl.name} ${secure ? "opening/disarming" : "securing"}`);
    action();
  };

  return (
    <div
      className={"secctl " + cls}
      onClick={toggle}
      role="button"
      tabIndex={unavail ? -1 : 0}
      onKeyDown={(e) => {
        if ((e.key === "Enter" || e.key === " ") && !unavail) toggle();
      }}
    >
      <div className="secctl-ic">
        <Icon size={22} strokeWidth={2} />
      </div>
      <div className="secctl-meta">
        <div className="secctl-n">{ctl.name}</div>
        <div className="secctl-s">{unavail ? "Unavailable" : label}</div>
      </div>
    </div>
  );
}

/**
 * Security control grid: outdoor + indoor alarm, gate, garage, front door,
 * screen gate, entertainment-area lock.
 *
 * The header is a glanceable verdict: a big green check + "All Secure" when
 * every non-ignored control is armed/closed/locked, otherwise a loud amber
 * banner naming what's still open/unlocked. The indoor alarm is excluded from
 * the verdict (it stays disarmed while we're home).
 */
export default function SecurityControls({ onToast }) {
  const { entities } = useHA();

  const watched = ENTITIES.securityControls.filter((c) => !c.ignore);
  const openItems = watched.filter((c) => {
    const { secure, unavail } = statusOf(c, entities[c.entity]?.state);
    return !secure && !unavail;
  });
  const allSecure = openItems.length === 0;

  return (
    <div className={"secctls rise" + (allSecure ? " is-secure" : " is-alert")}>
      <div className="secctls-head">
        <Shield size={16} strokeWidth={2} color="var(--gold)" />
        <span className="sect-title">Security</span>
        <div className={"secctls-verdict " + (allSecure ? "ok" : "warn")}>
          {allSecure ? (
            <>
              <span className="secctls-check"><Check size={18} strokeWidth={3} /></span>
              <span className="secctls-verdict-t"><ShieldCheck size={15} strokeWidth={2.4} /> All Secure</span>
            </>
          ) : (
            <span className="secctls-verdict-t">
              <AlertTriangle size={15} strokeWidth={2.4} />
              {openItems.length} open · {openItems.map((c) => c.name).join(", ")}
            </span>
          )}
        </div>
      </div>
      <div className="secctls-grid">
        {ENTITIES.securityControls.map((c) => (
          <ControlTile key={c.id} ctl={c} onToast={onToast} />
        ))}
      </div>
    </div>
  );
}
