import { Snowflake, Flame, Fan, CircleGauge, Wind, Plus, Minus, Thermometer } from "lucide-react";
import { ENTITIES } from "../entities";
import { useEntity } from "../ha/HaContext";
import { useService } from "../ha/useService";
import Switch from "./Switch";

const MODES = [
  { id: "cool", Icon: Snowflake },
  { id: "heat", Icon: Flame },
  { id: "fan_only", Icon: Fan },
  { id: "auto", Icon: CircleGauge },
  { id: "dry", Icon: Wind },
];

export default function ClimateCard({ onToast }) {
  const ent = useEntity(ENTITIES.climate);
  const call = useService();

  const target = Number(ent?.attributes?.temperature);
  const current = Number(ent?.attributes?.current_temperature);
  const hvacMode = ent?.state || "off";
  const minT = Number(ent?.attributes?.min_temp) || 16;
  const maxT = Number(ent?.attributes?.max_temp) || 30;
  const step = Number(ent?.attributes?.target_temp_step) || 0.5;
  const isOn = hvacMode !== "off" && hvacMode !== "unavailable";
  const unavail = !ent || hvacMode === "unavailable";

  const adjust = (delta) => {
    if (!ent || !Number.isFinite(target)) return;
    const t = Math.max(minT, Math.min(maxT, target + delta));
    onToast?.("thermometer", `Target ${t}°C`);
    call("climate", "set_temperature", { temperature: t }, { entity_id: ENTITIES.climate });
  };

  const setMode = (mode) => {
    onToast?.("activity", mode.replace("_", " "));
    call("climate", "set_hvac_mode", { hvac_mode: mode }, { entity_id: ENTITIES.climate });
  };

  const toggleOn = () => {
    if (isOn) {
      onToast?.("power-off", "AC off");
      call("climate", "turn_off", {}, { entity_id: ENTITIES.climate });
    } else {
      onToast?.("power", "AC on");
      call("climate", "turn_on", {}, { entity_id: ENTITIES.climate });
    }
  };

  return (
    <div className="span-ac" style={{ gridColumn: "span 4" }}>
      <div className="card rise">
        <div className="card-head">
          <div className="card-ic" style={{ color: "var(--blue)" }}>
            <Thermometer size={18} strokeWidth={2} />
          </div>
          <div>
            <div className="card-title">Air Conditioner</div>
            <div className="card-sub mlabel">
              {unavail ? "Unavailable" : Number.isFinite(current) ? `Room ${current.toFixed(1)}°C` : "Living Room"}
            </div>
          </div>
          <div className="spacer" />
          <Switch on={isOn} onClick={toggleOn} disabled={unavail} />
        </div>

        <div className="climate-dial-wrap">
          <button
            type="button"
            className="climate-stepper l"
            onClick={() => adjust(-step)}
            disabled={unavail || !isOn}
            aria-label="cooler"
          >
            <Minus size={16} strokeWidth={2.4} />
          </button>
          <div className="climate-dial">
            <div>
              <div className="climate-dial-val">
                {Number.isFinite(target) ? target.toFixed(0) : "—"}
                <span className="u">°C</span>
              </div>
              <div className="mlabel climate-dial-label">Target</div>
            </div>
          </div>
          <button
            type="button"
            className="climate-stepper r"
            onClick={() => adjust(step)}
            disabled={unavail || !isOn}
            aria-label="warmer"
          >
            <Plus size={16} strokeWidth={2.4} />
          </button>
        </div>

        <div className="climate-modes">
          {MODES.map(({ id, Icon }) => (
            <button
              key={id}
              type="button"
              className={"chip" + (hvacMode === id ? " on" : "")}
              onClick={() => setMode(id)}
              disabled={unavail}
              aria-label={id}
            >
              <Icon size={14} strokeWidth={2} />
            </button>
          ))}
        </div>

        <div className="climate-foot">
          <div className="climate-mode">
            Mode <strong>{hvacMode.replace(/_/g, " ")}</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
