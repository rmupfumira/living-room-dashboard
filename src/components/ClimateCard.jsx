import { Snowflake, Flame, Fan, Wind, CircleGauge, Power, Plus, Minus, Thermometer } from "lucide-react";
import { useEntity } from "../ha/HaContext";
import { useService } from "../ha/useService";

const MODES = [
  { id: "cool", Icon: Snowflake, label: "Cool" },
  { id: "heat", Icon: Flame, label: "Heat" },
  { id: "fan_only", Icon: Fan, label: "Fan" },
  { id: "dry", Icon: Wind, label: "Dry" },
  { id: "auto", Icon: CircleGauge, label: "Auto" },
];

/**
 * Air-conditioner thermostat (living-room climate slot).
 * `acEntity` = climate.* ; `tempEntity` = optional sensor for the current
 * room temperature (used when the climate entity doesn't report one, e.g.
 * reads 0 when off).
 */
export default function ClimateCard({ acEntity, tempEntity, onToast }) {
  const ent = useEntity(acEntity);
  const tempSensor = useEntity(tempEntity);
  const call = useService();

  const target = Number(ent?.attributes?.temperature);
  const acCur = Number(ent?.attributes?.current_temperature);
  const sensorCur = Number(tempSensor?.state);
  const current = Number.isFinite(acCur) && Math.abs(acCur) > 0.01
    ? acCur
    : Number.isFinite(sensorCur) ? sensorCur : null;
  const hvacMode = ent?.state || "off";
  const minT = Number(ent?.attributes?.min_temp) || 16;
  const maxT = Number(ent?.attributes?.max_temp) || 30;
  const stepT = Number(ent?.attributes?.target_temp_step) || 1;
  const isOn = hvacMode !== "off" && hvacMode !== "unavailable";
  const unavail = !ent || hvacMode === "unavailable";

  const adjust = (delta) => {
    if (!Number.isFinite(target)) return;
    const t = Math.max(minT, Math.min(maxT, target + delta));
    onToast?.("thermometer", `AC target ${t}°C`);
    call("climate", "set_temperature", { temperature: t }, { entity_id: acEntity });
  };
  const setMode = (mode) => {
    onToast?.("fan", mode.replace("_", " "));
    call("climate", "set_hvac_mode", { hvac_mode: mode }, { entity_id: acEntity });
  };
  const togglePower = () => {
    onToast?.("power", isOn ? "AC off" : "AC on");
    call("climate", isOn ? "turn_off" : "turn_on", {}, { entity_id: acEntity });
  };

  return (
    <div className="clim rise">
      <div className="clim-head">
        <Thermometer size={16} strokeWidth={2} color="var(--gold)" />
        <span className="sect-title">Air Conditioner</span>
      </div>

      <div className="clim-main">
        <div className="clim-dial-row">
          <button type="button" className="clim-step" onClick={() => adjust(-stepT)} disabled={unavail || !isOn} aria-label="cooler">
            <Minus size={20} strokeWidth={2.4} />
          </button>
          <div className="clim-dial">
            <div>
              <div className="clim-t tabular">
                {Number.isFinite(target) ? Math.round(target) : "—"}
                <span className="u">°</span>
              </div>
              <div className="clim-cur">
                {unavail ? "Unavailable" : current != null ? `Room ${current.toFixed(1)}°` : isOn ? hvacMode.replace("_", " ") : "Off"}
              </div>
            </div>
          </div>
          <button type="button" className="clim-step" onClick={() => adjust(stepT)} disabled={unavail || !isOn} aria-label="warmer">
            <Plus size={20} strokeWidth={2.4} />
          </button>
        </div>

        <div className="clim-modes">
          <button type="button" className={"clim-mode power" + (isOn ? " on" : "")} onClick={togglePower} disabled={unavail}>
            <Power size={17} strokeWidth={2.2} />
            {isOn ? "On" : "Off"}
          </button>
          {MODES.map(({ id, Icon, label }) => (
            <button
              key={id}
              type="button"
              className={"clim-mode" + (hvacMode === id ? " on" : "")}
              onClick={() => setMode(id)}
              disabled={unavail}
            >
              <Icon size={17} strokeWidth={2} />
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
