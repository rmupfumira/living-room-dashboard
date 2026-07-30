import { WashingMachine, Wind, Power, Check } from "lucide-react";
import { useService } from "../ha/useService";
import { useLaundry } from "../ha/useLaundry";

/**
 * Home laundry card. Appears only when something is worth surfacing —
 * a cycle running, a load finished (unload reminder), or a power switch
 * left off (so you notice a machine can't run). Tapping the power-off
 * flag switches the plug back on (turning power on isn't security-reducing).
 */
export default function LaundryStatus({ onToast }) {
  const { machines, anyRunning, anyDone, anyPowerOff } = useLaundry();
  const call = useService();

  if (!anyRunning && !anyDone && !anyPowerOff) return null;

  const active = machines.filter((m) => m.running || m.done);
  const poweredOff = machines.filter((m) => m.powerOff);

  const switchOn = (m) => {
    call(m.plug.split(".")[0], "turn_on", {}, { entity_id: m.plug });
    onToast?.("power", `${m.name} power on`);
  };

  return (
    <div className="lst rise">
      <div className="lst-head">
        <WashingMachine size={15} strokeWidth={2} color="var(--gold)" />
        <span className="sect-title">Laundry</span>
      </div>

      {active.map((m) => {
        const Icon = m.id === "washer" ? WashingMachine : Wind;
        return (
          <div className="lst-item" key={m.id}>
            <div className={"lst-row" + (m.done ? " done" : "")}>
              <span className="lst-ic">
                {m.done ? <Check size={20} strokeWidth={2.6} /> : <Icon size={20} strokeWidth={2} />}
              </span>
              <div className="lst-meta">
                <div className="lst-n">
                  {m.name}
                  <span className={"lst-badge " + (m.done ? "done" : "run")}>
                    {m.running && <span className="lst-live" />}
                    {m.label}
                  </span>
                </div>
                <div className="lst-s">{m.sub}</div>
              </div>
            </div>
            {m.running && m.progress != null && (
              <div className="lst-prog"><span style={{ width: m.progress + "%" }} /></div>
            )}
          </div>
        );
      })}

      {poweredOff.map((m) => (
        <button type="button" className="lst-warn" key={m.id} onClick={() => switchOn(m)}>
          <Power size={15} strokeWidth={2.2} />
          {m.name} power is <b>off</b> · tap to switch on
        </button>
      ))}
    </div>
  );
}
