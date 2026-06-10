import { useEffect, useState } from "react";
import { Zap, Sun, BatteryCharging, UtilityPole, House } from "lucide-react";
import { f1 } from "../lib/format";

const TILES = [
  { key: "solar", Icon: Sun, label: "Solar", tone: "var(--c-solar)", unit: "kW" },
  { key: "battery", Icon: BatteryCharging, label: "Battery", tone: "var(--c-batt)", unit: "%" },
  { key: "grid", Icon: UtilityPole, label: "Exporting", tone: "var(--c-grid)", unit: "kW" },
  { key: "load", Icon: House, label: "Home Load", tone: "var(--c-load)", unit: "kW" },
];

/**
 * Energy card — 2×2 stat grid + hand-rolled flex-bar sparkline of today's
 * solar curve. Solar/load values flicker subtly every 1.6s to feel live.
 */
export default function EnergyCard({ inverter: data }) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1600);
    return () => clearInterval(id);
  }, []);

  // Subtle flicker on solar + load — never lets them go negative.
  const flickerSolar = +(data.solar + ((tick % 2 ? 1 : -1) * 0.1)).toFixed(1);
  const flickerLoad = +(data.load + ((tick % 3 ? 0.05 : -0.05))).toFixed(1);
  const solar = Math.max(0, flickerSolar);
  const load = Math.max(0, flickerLoad);

  const max = Math.max(...data.curve);
  const tileValues = {
    solar: { big: f1(solar), sub: solar > 0.1 ? "PRODUCING" : "IDLE" },
    battery: { big: String(data.battery), sub: data.batteryFlow > 0 ? "CHARGING" : "DISCHARGING" },
    grid: { big: f1(data.grid), sub: data.grid < 0 ? "EXPORTING" : data.grid > 0 ? "IMPORTING" : "STANDBY" },
    load: { big: f1(load), sub: "DRAWING" },
  };

  return (
    <div className="card rise" style={{ gridColumn: "span 5" }}>
      <div className="card-head">
        <div className="card-ic">
          <Zap size={16} strokeWidth={2} />
        </div>
        <div>
          <div className="card-title">Power flow</div>
          <div className="card-sub mlabel">Self-sufficiency {data.selfSufficiency}%</div>
        </div>
        <div className="spacer" />
        <div className="live-chip">
          <span className="led on" />
          LIVE
        </div>
      </div>

      <div className="energy-grid">
        {TILES.map(({ key, Icon, label, tone, unit }) => {
          const { big, sub } = tileValues[key];
          return (
            <div className="estat" key={key} style={{ ["--tone"]: tone }}>
              <div className="estat-head">
                <div className="estat-ic">
                  <Icon size={16} strokeWidth={2} />
                </div>
                <span className="mlabel">{label}</span>
              </div>
              <div className="estat-v">
                {big}
                <span className="u">{unit}</span>
              </div>
              <div className="estat-sub">{sub}</div>
              <span className="estat-bar" />
            </div>
          );
        })}
      </div>

      <div className="spark">
        <div className="mlabel" style={{ marginBottom: 8 }}>Solar today · peak {data.solarPeak} kW</div>
        <div className="spark-bars">
          {data.curve.map((v, i) => (
            <div className="spark-col" key={i}>
              <div
                className={"spark-bar" + (v === max ? " lit" : "")}
                style={{ height: `${Math.max(4, (v / max) * 100)}%` }}
              />
              <span className="spark-label">{data.curveLabels[i]}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
