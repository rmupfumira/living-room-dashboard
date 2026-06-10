import * as L from "lucide-react";
import Switch from "./Switch";
import Led from "./Led";

function toPascal(name) {
  return name
    .split(/[-_]/)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join("");
}

/**
 * Single security tile — Garage, Gate, Outdoor Alarm, Indoor Alarm.
 * The whole card is clickable. `tone` drives border + icon-chip tint when `on`.
 *
 *   accessory  → tone "var(--c-solar)"   (Garage, Front Gate)
 *   alarm      → tone "var(--alert)"     (Outdoor/Indoor)
 */
export default function AccessCard({ icon, name, on, onLabel, offLabel, tone, onToggle }) {
  const Icon = L[toPascal(icon)] || L.Square;
  // status LED tone — choose by tile semantics, not by toggle state
  const ledTone = tone.includes("alert") ? "alert" : tone.includes("warn") || tone.includes("solar") ? "warn" : "on";

  return (
    <div
      className={"card access" + (on ? " on" : "")}
      style={{ gridColumn: "span 3", ["--tone"]: tone }}
      onClick={onToggle}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onToggle();
      }}
    >
      <div className="access-top">
        <div className="access-ic">
          <Icon size={18} strokeWidth={2} />
        </div>
        <Switch on={on} onClick={onToggle} />
      </div>
      <div className="access-name">{name}</div>
      <div className="access-status">
        <Led tone={on ? ledTone : "default"} />
        <span className="mlabel">{on ? onLabel : offLabel}</span>
      </div>
    </div>
  );
}
