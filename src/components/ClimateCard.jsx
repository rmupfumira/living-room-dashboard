import { Thermometer, Snowflake, Flame, Fan, CircleGauge } from "lucide-react";
import Led from "./Led";
import Switch from "./Switch";

const MODES = [
  { id: "cool", Icon: Snowflake, label: "Cool" },
  { id: "heat", Icon: Flame, label: "Heat" },
  { id: "fan", Icon: Fan, label: "Fan" },
  { id: "auto", Icon: CircleGauge, label: "Auto" },
];

/**
 * Active-room climate card — temp readout, target stepper, humidity,
 * mode buttons, swing/eco toggles, watt draw.
 */
export default function ClimateCard({ roomName, climate, onPatch, onToast }) {
  const adjust = (delta) => {
    const target = Math.max(16, Math.min(30, climate.target + delta));
    onPatch({ target });
    onToast("thermometer", `Target ${target}°C`);
  };

  const setMode = (mode) => {
    onPatch({ mode });
    onToast("activity", `${mode.toUpperCase()} mode`);
  };

  const toggleSwing = () => {
    onPatch({ swing: !climate.swing });
    onToast("wind", `Swing ${!climate.swing ? "on" : "off"}`);
  };

  const toggleEco = () => {
    onPatch({ auto: !climate.auto });
    onToast("leaf", `Eco ${!climate.auto ? "on" : "off"}`);
  };

  return (
    <div className="card rise" style={{ gridColumn: "span 4" }}>
      <div className="card-head">
        <div className="card-ic">
          <Thermometer size={16} strokeWidth={2} />
        </div>
        <div>
          <div className="card-title">Climate</div>
          <div className="card-sub mlabel">{roomName}</div>
        </div>
        <div className="spacer" />
        <Led tone="on" />
      </div>

      <div className="climate-temp">
        {climate.temp}
        <span className="unit">°C</span>
      </div>

      <div className="climate-target">
        <button type="button" className="stepper-btn" onClick={() => adjust(-0.5)} aria-label="cooler">−</button>
        <div>
          <div className="climate-target-val">{climate.target.toFixed(1)}°</div>
          <div className="mlabel" style={{ marginTop: 2 }}>Target</div>
        </div>
        <button type="button" className="stepper-btn" onClick={() => adjust(0.5)} aria-label="warmer">+</button>
        <div className="climate-hum">
          <div className="v">{climate.humidity}%</div>
          <div className="mlabel" style={{ marginTop: 2 }}>Humidity</div>
        </div>
      </div>

      <div className="mode-row">
        {MODES.map(({ id, Icon }) => (
          <button
            key={id}
            type="button"
            className={"mode-btn" + (climate.mode === id ? " on" : "")}
            onClick={() => setMode(id)}
            aria-label={id}
          >
            <Icon size={16} strokeWidth={2} />
          </button>
        ))}
      </div>

      <div className="climate-foot">
        <button type="button" className={"chip" + (climate.swing ? " on" : "")} onClick={toggleSwing}>
          Swing
        </button>
        <button type="button" className={"chip" + (climate.auto ? " on" : "")} onClick={toggleEco}>
          Eco
        </button>
        <div className="draw">
          <div className="draw-v">{climate.watt} W</div>
          <div className="mlabel" style={{ marginTop: 2 }}>Drawing</div>
        </div>
      </div>
    </div>
  );
}
