import * as L from "lucide-react";
import { LayoutDashboard, Power, Plug, WashingMachine, Wind } from "lucide-react";
import { ENTITIES } from "../entities";
import { useEntity, useHA } from "../ha/HaContext";
import { useService } from "../ha/useService";
import { useLaundry } from "../ha/useLaundry";
import Switch from "./Switch";

function toPascal(name) {
  return String(name || "").split(/[-_]/).map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join("");
}

/** One switchable device tile — icon + name + on/off, whole tile toggles. */
function DeviceTile({ item, kind, groupIcon, onToast }) {
  const ent = useEntity(item.entity);
  const call = useService();
  const state = ent?.state;
  const unavail = !ent || state === "unavailable" || state === "unknown";
  const on = state === "on";
  const Icon = L[toPascal(item.icon || groupIcon)] || Plug;

  const toggle = () => {
    if (unavail) return;
    call(item.entity.split(".")[0], "toggle", {}, { entity_id: item.entity });
    onToast?.(on ? "power-off" : "power", `${item.name} ${on ? "off" : "on"}`);
  };

  return (
    <button
      type="button"
      className={"dv-tile " + kind + (on ? " on" : "") + (unavail ? " na" : "")}
      onClick={toggle}
      disabled={unavail}
      aria-label={item.name}
    >
      <span className="dv-ic"><Icon size={20} strokeWidth={2} /></span>
      <span className="dv-meta">
        <span className="dv-n">{item.name}</span>
        <span className="dv-s">{unavail ? "Offline" : on ? "On" : "Off"}</span>
      </span>
      <span className="dv-sw" />
    </button>
  );
}

/** Washer/dryer appliance card — status + progress + always-visible POWER switch. */
function ApplianceCard({ m, onToast }) {
  const call = useService();
  const Icon = m.id === "washer" ? WashingMachine : Wind;
  const togglePower = () => {
    if (m.plugUnavail) return;
    call(m.plug.split(".")[0], "toggle", {}, { entity_id: m.plug });
    onToast?.(m.plugOn ? "power-off" : "power", `${m.name} power ${m.plugOn ? "off" : "on"}`);
  };
  const badge = m.running ? "run" : m.done ? "done" : m.powerOff ? "off" : "idle";

  return (
    <div className={"dv-appcard" + (m.powerOff ? " pooff" : "") + (m.running ? " run" : "")}>
      <div className="dv-apphead">
        <span className="dv-appi"><Icon size={20} strokeWidth={2} /></span>
        <span className="dv-appn">{m.name}</span>
        <span className={"dv-badge " + badge}>
          {m.running && <span className="dv-live" />}
          {m.label}
        </span>
      </div>
      <div className="dv-appsub">{m.sub}</div>
      {m.running && m.progress != null && (
        <div className="dv-prog"><span style={{ width: m.progress + "%" }} /></div>
      )}
      <div className="dv-apppow">
        <span className="dv-pl"><Power size={15} strokeWidth={2.2} /> Power</span>
        <Switch on={m.plugOn} onClick={togglePower} disabled={m.plugUnavail} ariaLabel={m.name + " power"} />
      </div>
    </div>
  );
}

/**
 * Devices — the whole-house appliance / power-switch control page.
 * Grouped switchable loads, with the washer + dryer promoted to rich
 * appliance cards (running / done / power-off, plus their power switch).
 */
export default function DevicesView({ onToast }) {
  const { entities } = useHA();
  const laundry = useLaundry();

  // Summary counts across every device switch.
  const allItems = ENTITIES.devices.flatMap((g) => g.items);
  const stateOf = (e) => entities[e]?.state;
  const on = allItems.filter((i) => stateOf(i.entity) === "on").length;
  const off = allItems.filter((i) => stateOf(i.entity) === "off").length;
  const offline = allItems.filter((i) => {
    const s = stateOf(i.entity);
    return !s || s === "unavailable" || s === "unknown";
  }).length;
  const running = laundry.machines.filter((m) => m.running).length;

  return (
    <div className="devices-view rise">
      <div className="dv-summaryhead">
        <div className="dv-title">
          <LayoutDashboard size={18} strokeWidth={2} color="var(--gold)" />
          <span className="sect-title">Devices</span>
        </div>
        <div className="dv-summary">
          {running > 0 && <span className="dv-chip run"><span className="dot" />{running} Running</span>}
          <span className="dv-chip ok"><span className="dot" />{on} On</span>
          <span className="dv-chip mut"><span className="dot" />{off} Off</span>
          {offline > 0 && <span className="dv-chip bad"><span className="dot" />{offline} Offline</span>}
        </div>
      </div>

      {ENTITIES.devices.map((group) =>
        group.kind === "laundry" ? (
          <section className="dv-group" key={group.group}>
            <div className="dv-glabel">{group.group} <b>· washer &amp; dryer</b></div>
            <div className="dv-appgrid">
              {laundry.machines.map((m) => (
                <ApplianceCard key={m.id} m={m} onToast={onToast} />
              ))}
            </div>
          </section>
        ) : (
          <section className="dv-group" key={group.group}>
            <div className="dv-glabel">{group.group} <b>· {group.items.length}</b></div>
            <div className="dv-grid">
              {group.items.map((item) => (
                <DeviceTile key={item.entity} item={item} kind={group.kind} groupIcon={group.icon} onToast={onToast} />
              ))}
            </div>
          </section>
        )
      )}
    </div>
  );
}
