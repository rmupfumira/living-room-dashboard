import { Sun, House, UtilityPole, Zap, Battery, BatteryLow, BatteryMedium, BatteryFull, BatteryCharging, BatteryWarning } from "lucide-react";
import { ENTITIES } from "../entities";
import { useEntity } from "../ha/HaContext";

function num(ent, fallback = 0) {
  const v = Number(ent?.state);
  return Number.isFinite(v) ? v : fallback;
}
function toKw(ent) {
  if (!ent) return 0;
  const v = num(ent, 0);
  const unit = (ent.attributes?.unit_of_measurement || "").toLowerCase();
  return unit === "w" ? v / 1000 : v;
}
const f1 = (n) => (Math.round(Math.abs(n) * 10) / 10).toFixed(1);

function batteryVisual(socPct, charging) {
  if (!Number.isFinite(socPct)) return { Icon: Battery, color: "var(--ink-faint)" };
  if (charging) return { Icon: BatteryCharging, color: "var(--success)" };
  if (socPct >= 80) return { Icon: BatteryFull, color: "var(--success)" };
  if (socPct >= 50) return { Icon: BatteryMedium, color: "#a9c74a" };
  if (socPct >= 25) return { Icon: BatteryLow, color: "var(--warning)" };
  if (socPct >= 10) return { Icon: BatteryLow, color: "#e07b3a" };
  return { Icon: BatteryWarning, color: "var(--critical)" };
}

/**
 * Simplified solar (correction 7) — only PV / Load / Grid / Battery,
 * large typography, no flow diagram. 2×2 of big readouts.
 */
export default function SolarCard() {
  const pvPower = useEntity(ENTITIES.power.pvPower);
  const loadPower = useEntity(ENTITIES.power.loadPower);
  const gridPower = useEntity(ENTITIES.power.gridPower);
  const soc = useEntity(ENTITIES.power.batterySoc);
  const battPower = useEntity(ENTITIES.power.batteryPower);
  const selfS = useEntity(ENTITIES.power.selfSufficiency);

  const pvKw = toKw(pvPower);
  const loadKw = toKw(loadPower);
  const gridKw = toKw(gridPower);
  const battKw = toKw(battPower);
  const socPct = num(soc, NaN);
  const selfPct = num(selfS, NaN);
  const importing = gridKw > 0.05;
  const exporting = gridKw < -0.05;
  const charging = battKw > 0.05;
  const battVis = batteryVisual(socPct, charging);

  return (
    <div className="solar rise">
      <div className="solar-head">
        <Zap size={15} strokeWidth={2} color="var(--gold)" />
        <span className="sect-title">Solar System</span>
        {Number.isFinite(selfPct) && <span className="self">{selfPct.toFixed(0)}% self-sufficient</span>}
      </div>

      <div className="solar-grid">
        <div className="sstat">
          <div className="sstat-top">
            <Sun size={16} strokeWidth={2} color="var(--gold)" />
            <span className="k">PV Power</span>
          </div>
          <div className="v tabular">{f1(pvKw)}<span className="u">kW</span></div>
        </div>
        <div className="sstat">
          <div className="sstat-top">
            <House size={16} strokeWidth={2} color="var(--ink-soft)" />
            <span className="k">Load</span>
          </div>
          <div className="v tabular">{f1(loadKw)}<span className="u">kW</span></div>
        </div>
        <div className="sstat">
          <div className="sstat-top">
            <UtilityPole size={16} strokeWidth={2} color={importing ? "var(--warning)" : exporting ? "var(--success)" : "var(--ink-mute)"} />
            <span className="k">{importing ? "Importing" : exporting ? "Exporting" : "Grid"}</span>
          </div>
          <div className="v tabular">{f1(gridKw)}<span className="u">kW</span></div>
        </div>
        <div className="sstat">
          <div className="sstat-top">
            <battVis.Icon size={16} strokeWidth={2} color={battVis.color} />
            <span className="k">Battery</span>
          </div>
          <div className="v tabular" style={{ color: battVis.color }}>
            {Number.isFinite(socPct) ? Math.round(socPct) : "—"}<span className="u">%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
