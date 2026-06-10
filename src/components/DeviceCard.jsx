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
 * Small device tile (span 3) — icon chip + switch + name + model + status row.
 * Click anywhere or hit the switch to toggle.
 */
export default function DeviceCard({ dev, icon, onToggle }) {
  const Icon = L[toPascal(icon)] || L.Plug;
  return (
    <div
      className={"card dev" + (dev.on ? " on" : "")}
      style={{ gridColumn: "span 3" }}
      onClick={onToggle}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onToggle();
      }}
    >
      <div className="dev-top">
        <div className="dev-ic">
          <Icon size={18} strokeWidth={2} />
        </div>
        <Switch on={dev.on} onClick={onToggle} />
      </div>
      <div>
        <div className="dev-name">{dev.name}</div>
        <div className="dev-model">{dev.model}</div>
      </div>
      <div className="dev-foot">
        <Led tone={dev.on ? "on" : "default"} />
        <span className="mlabel">{dev.on ? "Active" : "Standby"}</span>
      </div>
    </div>
  );
}
