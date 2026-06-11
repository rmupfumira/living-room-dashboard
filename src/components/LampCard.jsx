import { Lightbulb, Sun } from "lucide-react";
import { ENTITIES } from "../entities";
import { useEntity } from "../ha/HaContext";
import { useService } from "../ha/useService";
import Switch from "./Switch";

/* HA SUPPORT_BRIGHTNESS bit — only show the slider if the light supports it. */
const SUPPORT_BRIGHTNESS = 1;

export default function LampCard({ onToast }) {
  const ent = useEntity(ENTITIES.lamp);
  const call = useService();

  const on = ent?.state === "on";
  const unavail = !ent || ent.state === "unavailable";
  const supports = ent?.attributes?.supported_features ?? 0;
  const supportsBrightness = (supports & SUPPORT_BRIGHTNESS) === SUPPORT_BRIGHTNESS;
  const bri = ent?.attributes?.brightness ?? 0;
  const pct = on ? Math.round((bri / 255) * 100) : 0;
  const name = ent?.attributes?.friendly_name || "Smart Lamp";

  const toggle = () => {
    onToast?.(on ? "power-off" : "power", `${name} ${on ? "off" : "on"}`);
    call("light", "toggle", {}, { entity_id: ENTITIES.lamp });
  };

  const setBri = (newPct) => {
    call("light", "turn_on", { brightness_pct: newPct }, { entity_id: ENTITIES.lamp });
  };

  return (
    <div className="span-lamp" style={{ gridColumn: "span 3" }}>
      <div className="card rise">
        <div className="card-head">
          <div className="card-ic" style={{ color: "var(--blue)" }}>
            <Lightbulb size={18} strokeWidth={2} />
          </div>
          <div>
            <div className="card-title">Smart Lamp</div>
            <div className="card-sub mlabel">{name}</div>
          </div>
          <div className="spacer" />
          <Switch on={on} onClick={toggle} disabled={unavail} />
        </div>

        <div className={"lamp-bulb" + (on ? " on" : "")}>
          <Lightbulb size={32} strokeWidth={1.5} />
        </div>
        <div className="lamp-state mlabel">
          {unavail ? "Unavailable" : on ? "On" : "Off"}
        </div>

        {supportsBrightness && (
          <div className="lamp-slider">
            <Sun size={14} strokeWidth={2} color="var(--ink-mute)" />
            <input
              type="range"
              min={1}
              max={100}
              value={pct}
              onChange={(e) => setBri(Number(e.target.value))}
              disabled={unavail || !on}
              style={{ ["--vp"]: `${pct}%` }}
            />
            <span className="lamp-pct">{pct}%</span>
          </div>
        )}
      </div>
    </div>
  );
}
