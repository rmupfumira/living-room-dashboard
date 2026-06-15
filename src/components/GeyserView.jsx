import { Flame, Minus, Plus, Droplet, Zap } from "lucide-react";
import { ENTITIES } from "../entities";
import { useEntity } from "../ha/HaContext";
import { useService } from "../ha/useService";
import Switch from "./Switch";

const num = (ent) => { const v = Number(ent?.state); return Number.isFinite(v) ? v : NaN; };

/** Full-page Geyser view — current temp, target setpoint, power draw, on/off. */
export default function GeyserView({ onToast }) {
  const G = ENTITIES.geyser;
  const toggleEnt = useEntity(G.toggle);
  const curEnt = useEntity(G.currentTemp);
  const tgtEnt = useEntity(G.targetTemp);
  const powEnt = useEntity(G.power);
  const ctrlEnt = useEntity(G.controller);
  const call = useService();

  const on = toggleEnt?.state === "on";
  const unavail = !toggleEnt || toggleEnt.state === "unavailable";
  const current = num(curEnt);
  const target = num(tgtEnt);
  const power = num(powEnt);
  const tgtMin = Number(tgtEnt?.attributes?.min) || 30;
  const tgtMax = Number(tgtEnt?.attributes?.max) || 75;
  const tgtStep = Number(tgtEnt?.attributes?.step) || 1;
  const heating = on && Number.isFinite(power) && power > 50;

  const ctrlOn = ctrlEnt?.state === "on";
  const ctrlUnavail = !ctrlEnt || ctrlEnt.state === "unavailable";

  const toggleDb = () => {
    onToast?.(on ? "power-off" : "power", `Geyser DB switch ${on ? "off" : "on"}`);
    call("switch", "toggle", {}, { entity_id: G.toggle });
  };
  const toggleCtrl = () => {
    onToast?.(ctrlOn ? "power-off" : "power", `Controller ${ctrlOn ? "off" : "on"}`);
    call("switch", "toggle", {}, { entity_id: G.controller });
  };
  const adjust = (delta) => {
    if (!Number.isFinite(target)) return;
    const v = Math.max(tgtMin, Math.min(tgtMax, target + delta));
    onToast?.("thermometer", `Geyser target ${v}°`);
    call("input_number", "set_value", { value: v }, { entity_id: G.targetTemp });
  };

  // progress of current temp between min and max for the ring fill
  const pct = Number.isFinite(current) ? Math.max(0, Math.min(100, ((current - tgtMin) / (tgtMax - tgtMin)) * 100)) : 0;

  return (
    <div className="sysview">
      <div className="sv-head">
        <Flame size={18} strokeWidth={2} color="var(--gold)" />
        <span className="sect-title">Geyser</span>
        <span className={"sv-pill " + (heating ? "warn" : on ? "ok" : "")} style={{ marginLeft: "auto" }}>
          {unavail ? "Unavailable" : heating ? "Heating" : on ? "On · idle" : "Off"}
        </span>
      </div>

      <div className="gv-body">
        <div className="gv-dial" style={{ "--pct": pct + "%" }}>
          <div className="gv-dial-inner">
            <div className="gv-cur tabular">{Number.isFinite(current) ? Math.round(current) : "—"}<span className="u">°</span></div>
            <div className="gv-cur-l"><Droplet size={13} strokeWidth={2} /> Water temp</div>
          </div>
        </div>

        <div className="gv-side">
          <div className="gv-target">
            <button type="button" className="gv-step" onClick={() => adjust(-tgtStep)} disabled={unavail} aria-label="lower">
              <Minus size={22} strokeWidth={2.4} />
            </button>
            <div className="gv-target-mid">
              <div className="gv-target-v tabular">{Number.isFinite(target) ? Math.round(target) : "—"}°</div>
              <div className="gv-target-l">Target temperature</div>
            </div>
            <button type="button" className="gv-step" onClick={() => adjust(tgtStep)} disabled={unavail} aria-label="raise">
              <Plus size={22} strokeWidth={2.4} />
            </button>
          </div>

          <div className="gv-power">
            <div className="gv-power-ic" style={{ color: heating ? "var(--warning)" : "var(--ink-mute)" }}>
              <Zap size={22} strokeWidth={2} />
            </div>
            <div>
              <div className="gv-power-v tabular">
                {Number.isFinite(power) ? Math.round(power) : "—"}<span className="u">W</span>
              </div>
              <div className="gv-power-l">{heating ? "Drawing power — heating" : "Element idle"}</div>
            </div>
          </div>

          <div className="gv-switches">
            <div className="gv-sw">
              <div className="gv-sw-meta">
                <div className="gv-sw-n">DB Switch</div>
                <div className="gv-sw-s">Mains isolator</div>
              </div>
              <Switch on={on} onClick={toggleDb} disabled={unavail} ariaLabel="Geyser DB switch" />
            </div>
            <div className="gv-sw">
              <div className="gv-sw-meta">
                <div className="gv-sw-n">Controller</div>
                <div className="gv-sw-s">GeyserWise power</div>
              </div>
              <Switch on={ctrlOn} onClick={toggleCtrl} disabled={ctrlUnavail} ariaLabel="GeyserWise controller" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
