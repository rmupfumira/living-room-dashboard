import * as L from "lucide-react";
import { Shirt, Check } from "lucide-react";
import { ENTITIES } from "../entities";
import { useEntity } from "../ha/HaContext";

function toPascal(name) {
  return String(name).split(/[-_]/).map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join("");
}

/** Relative "finished N ago" helper from an input_datetime state. */
function ago(iso) {
  if (!iso) return "";
  const t = new Date(iso.replace(" ", "T")).getTime();
  if (!Number.isFinite(t)) return "";
  const mins = Math.floor((Date.now() - t) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

/** One appliance status tile (read-only). Running = gold pulse, Finished = muted check. */
function ApplianceTile({ item }) {
  const ent = useEntity(item.entity);
  const fin = useEntity(item.finished);
  const Icon = L[toPascal(item.icon)] || Shirt;
  const unavail = !ent || ent.state === "unavailable";
  const running = ent?.state === "running";

  return (
    <div className={"laundry-tile" + (running ? " running" : "")}>
      <div className="laundry-ic">
        <Icon size={24} strokeWidth={2} />
      </div>
      <div className="laundry-meta">
        <div className="laundry-n">{item.name}</div>
        <div className="laundry-s">
          {unavail ? "Unavailable" : running ? "Running" : "Finished"}
        </div>
      </div>
      {!unavail && !running && fin?.state && (
        <span className="laundry-done" title="Finished">
          <Check size={14} strokeWidth={2.5} />
        </span>
      )}
      {running && <span className="led gold pulse" />}
    </div>
  );
}

/** Compact laundry status card — Washer + Dryer. */
export default function LaundryCard() {
  return (
    <div className="laundry rise">
      <div className="laundry-head">
        <Shirt size={15} strokeWidth={2} color="var(--gold)" />
        <span className="sect-title">Laundry</span>
      </div>
      <div className="laundry-grid">
        {ENTITIES.laundry.map((item) => (
          <ApplianceTile key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}
