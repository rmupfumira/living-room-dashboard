import { Sun, House, UtilityPole, Zap, Battery, BatteryLow, BatteryMedium, BatteryFull, BatteryCharging, BatteryWarning, ArrowDownToLine, ArrowUpFromLine } from "lucide-react";
import { ENTITIES } from "../entities";
import { useEntity } from "../ha/HaContext";

/** Coerce a sensor reading to a number (state in W or kW etc). */
function num(ent, fallback = 0) {
  const v = Number(ent?.state);
  return Number.isFinite(v) ? v : fallback;
}
/** Convert watts to kW (some sensors expose W, others kW — sniff unit). */
function toKw(ent) {
  if (!ent) return 0;
  const v = num(ent, 0);
  const unit = (ent.attributes?.unit_of_measurement || "").toLowerCase();
  return unit === "w" ? v / 1000 : v;
}
const f1 = (n) => (Math.round(Math.abs(n) * 10) / 10).toFixed(1);
const fInt = (n) => String(Math.round(n));

/**
 * Pick the battery icon + tone from SoC + charge direction.
 *   charging   → BatteryCharging in green
 *   ≥ 80%      → BatteryFull in green
 *   ≥ 50%      → BatteryMedium in lime
 *   ≥ 25%      → BatteryLow in amber
 *   ≥ 10%      → BatteryLow in orange
 *   < 10%      → BatteryWarning in red (pulsing)
 */
function batteryVisual(socPct, charging) {
  if (!Number.isFinite(socPct)) {
    return { Icon: Battery, color: "var(--ink-faint)", glow: false, pulse: false };
  }
  if (charging) {
    return { Icon: BatteryCharging, color: "#57e08a", glow: true, pulse: false };
  }
  if (socPct >= 80) return { Icon: BatteryFull, color: "#57e08a", glow: true, pulse: false };
  if (socPct >= 50) return { Icon: BatteryMedium, color: "#b8f24a", glow: true, pulse: false };
  if (socPct >= 25) return { Icon: BatteryLow, color: "#ffc46b", glow: true, pulse: false };
  if (socPct >= 10) return { Icon: BatteryLow, color: "#ff9c4d", glow: true, pulse: false };
  return { Icon: BatteryWarning, color: "#ff4d6d", glow: true, pulse: true };
}

/** A single 18px-radius solar/load/grid/battery tile. */
function Tile({ klass, Icon, label, value, unit, sub, barPct = null, unavail = false, iconColor, iconGlow = false, iconPulse = false }) {
  const cls = "solar-tile " + klass + (unavail ? " unavail" : "");
  const icStyle = iconColor ? { color: iconColor } : undefined;
  return (
    <div className={cls}>
      <div className={"ic" + (iconGlow ? " glow" : "") + (iconPulse ? " pulse" : "")} style={icStyle}>
        <Icon size={24} strokeWidth={2.2} />
      </div>
      <div className="label">{label}</div>
      <div className="value">
        {unavail ? "—" : value}
        {!unavail && unit && <span className="u">{unit}</span>}
      </div>
      <div className="sub">{unavail ? "Unavailable" : sub}</div>
      <div className="bar">
        <div className="bar-fill" style={{ width: barPct == null ? "0%" : `${Math.max(2, Math.min(100, barPct))}%` }} />
      </div>
    </div>
  );
}

export default function SolarTiles() {
  const pvPower = useEntity(ENTITIES.power.pvPower);
  const pvToday = useEntity(ENTITIES.power.pvToday);
  const pvPeakF = useEntity(ENTITIES.power.pvPeakForecast);
  const loadPower = useEntity(ENTITIES.power.loadPower);
  const loadToday = useEntity(ENTITIES.power.loadToday);
  const gridPower = useEntity(ENTITIES.power.gridPower);
  const gridIn = useEntity(ENTITIES.power.gridImportToday);
  const gridOut = useEntity(ENTITIES.power.gridExportToday);
  const soc = useEntity(ENTITIES.power.batterySoc);
  const battPower = useEntity(ENTITIES.power.batteryPower);
  const selfS = useEntity(ENTITIES.power.selfSufficiency);

  const pvKw = toKw(pvPower);
  const loadKw = toKw(loadPower);
  const gridKw = toKw(gridPower);
  const battKw = toKw(battPower);
  const socPct = num(soc, NaN);
  const peakKw = num(pvPeakF, 0) || 6.0;

  const importing = gridKw > 0.05;
  const exporting = gridKw < -0.05;
  const charging = battKw > 0.05;
  const discharging = battKw < -0.05;
  const selfPct = num(selfS, NaN);

  // Grid icon: changes direction based on import/export
  const GridIcon = exporting ? ArrowUpFromLine : importing ? ArrowDownToLine : UtilityPole;
  const gridColor = exporting ? "#57e08a" : importing ? "#ff9c4d" : "#38a3ff";
  // Compact grid sub: only show the direction that's relevant; both if standby.
  const gridSub = exporting
    ? `↑ ${f1(num(gridOut, 0))} kWh today`
    : importing
    ? `↓ ${f1(num(gridIn, 0))} kWh today`
    : `↓ ${f1(num(gridIn, 0))} · ↑ ${f1(num(gridOut, 0))} kWh`;

  // Battery icon + colour by SoC + charge direction
  const battVis = batteryVisual(socPct, charging);

  return (
    <div className="span-solar" style={{ gridColumn: "span 8" }}>
      <div className="card rise">
        <div className="card-head">
          <div className="card-ic" style={{ color: "var(--blue)" }}>
            <Zap size={18} strokeWidth={2} />
          </div>
          <div>
            <div className="card-title">Solar System</div>
            <div className="card-sub mlabel">
              {Number.isFinite(selfPct) ? `Self-sufficiency ${selfPct.toFixed(1)}%` : "Live"}
            </div>
          </div>
          <div className="spacer" />
          <span className="glass-pill live">
            <span className="led" /> LIVE
          </span>
        </div>

        <div className="solar-grid">
          <Tile
            klass="solar"
            Icon={Sun}
            iconColor="#ffc46b"
            iconGlow
            label="PV Power"
            value={f1(pvKw)}
            unit="kW"
            sub={`${f1(num(pvToday, 0))} kWh today`}
            barPct={(pvKw / Math.max(peakKw, 0.5)) * 100}
            unavail={!pvPower}
          />
          <Tile
            klass="load"
            Icon={House}
            iconColor="#c8cad6"
            iconGlow
            label="Load"
            value={f1(loadKw)}
            unit="kW"
            sub={`${f1(num(loadToday, 0))} kWh today`}
            barPct={Math.min(100, (loadKw / Math.max(loadKw + 1, 5)) * 100)}
            unavail={!loadPower}
          />
          <Tile
            klass="grid"
            Icon={GridIcon}
            iconColor={gridColor}
            iconGlow={importing || exporting}
            label="Grid"
            value={f1(gridKw)}
            unit="kW"
            sub={gridSub}
            barPct={Math.min(100, Math.abs(gridKw) * 10)}
            unavail={!gridPower}
          />
          <Tile
            klass="battery"
            Icon={battVis.Icon}
            iconColor={battVis.color}
            iconGlow={battVis.glow}
            iconPulse={battVis.pulse}
            label="Battery"
            value={Number.isFinite(socPct) ? fInt(socPct) : "—"}
            unit="%"
            sub={
              charging
                ? `Charging ${f1(battKw)} kW`
                : discharging
                ? `Discharging ${f1(battKw)} kW`
                : "Holding"
            }
            barPct={Number.isFinite(socPct) ? socPct : 0}
            unavail={!soc}
          />
        </div>
      </div>
    </div>
  );
}
