import { useEffect, useMemo, useState } from "react";
import { Cctv } from "lucide-react";
import Led from "./Led";
import { ENTITIES } from "../entities";
import { useHA } from "../ha/HaContext";
import { haAuthUrl } from "../ha/useService";

/**
 * Single primary camera + selector chips (correction 2).
 * One large feed at a time; chips switch between Front Door / Pool / Garage.
 * Authed snapshot refreshed every 5s.
 */
export default function CamerasCard() {
  const { entities } = useHA();
  const [activeId, setActiveId] = useState(ENTITIES.cameras[0].id);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 5000);
    return () => clearInterval(id);
  }, []);

  const active = ENTITIES.cameras.find((c) => c.id === activeId) || ENTITIES.cameras[0];
  const ent = entities[active.entity];
  const path = ent?.attributes?.entity_picture;
  const live = ent && ent.state !== "unavailable";

  const src = useMemo(() => {
    if (!path) return "";
    const url = haAuthUrl(path);
    return url + (url.includes("?") ? "&" : "?") + "t=" + tick;
  }, [path, tick]);

  return (
    <div className="cams rise">
      <div className="cams-head">
        <Cctv size={15} strokeWidth={2} color="var(--gold)" />
        <span className="sect-title">Cameras</span>
      </div>

      <div className="cam-stage">
        {src ? (
          <img src={src} alt={active.name} onError={(e) => { e.currentTarget.style.display = "none"; }} />
        ) : (
          <div className="cam-fallback">{active.name}</div>
        )}
        <div className="cam-overlay">
          <span className="cam-nm">{active.name}</span>
          <span className="cam-live">
            <Led tone={live ? "critical" : "default"} pulse={live} />
            {live ? "LIVE" : "OFFLINE"}
          </span>
        </div>
      </div>

      <div className="cam-chips">
        {ENTITIES.cameras.map((c) => (
          <button
            key={c.id}
            type="button"
            className={"cam-chip" + (c.id === activeId ? " on" : "")}
            onClick={() => setActiveId(c.id)}
          >
            {c.name}
          </button>
        ))}
      </div>
    </div>
  );
}
