import { Lightbulb, Sun } from "lucide-react";
import { ENTITIES } from "../entities";
import { useEntity } from "../ha/HaContext";
import { useService } from "../ha/useService";
import Switch from "./Switch";

/* HA SUPPORT_BRIGHTNESS bit — only on light.* entities; switch.* never has it. */
const SUPPORT_BRIGHTNESS = 1;

/**
 * Domain-aware lamp card — works with any toggleable entity:
 *   light.*     → light.toggle / light.turn_on (with brightness_pct if supported)
 *   switch.*    → switch.toggle / switch.turn_on
 *   input_boolean.* → input_boolean.toggle
 *
 * The brightness slider auto-hides for non-dimmable entities; the card name
 * comes from the entity's friendly_name regardless of domain.
 */
export default function LampCard({ onToast }) {
  const entityId = ENTITIES.lamp;
  const ent = useEntity(entityId);
  const call = useService();

  const domain = entityId.split(".")[0];
  const on = ent?.state === "on";
  const unavail = !ent || ent.state === "unavailable";
  const supports = ent?.attributes?.supported_features ?? 0;
  // brightness only ever applies to light.*
  const supportsBrightness =
    domain === "light" && (supports & SUPPORT_BRIGHTNESS) === SUPPORT_BRIGHTNESS;
  const bri = ent?.attributes?.brightness ?? 0;
  const pct = on ? Math.round((bri / 255) * 100) : 0;
  const name = ent?.attributes?.friendly_name || "Smart Lamp";

  const toggle = () => {
    onToast?.(on ? "power-off" : "power", `${name} ${on ? "off" : "on"}`);
    call(domain, "toggle", {}, { entity_id: entityId });
  };

  const setBri = (newPct) => {
    if (domain !== "light") return;
    call("light", "turn_on", { brightness_pct: newPct }, { entity_id: entityId });
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
