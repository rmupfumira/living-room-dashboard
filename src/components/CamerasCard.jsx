import { useEffect, useMemo, useState } from "react";
import { Cctv, ChevronRight } from "lucide-react";
import Led from "./Led";
import { ENTITIES } from "../entities";
import { useEntity } from "../ha/HaContext";
import { haAuthUrl } from "../ha/useService";

/** One landscape camera tile — authed snapshot refreshed every 6s. */
function CamTile({ cam, tick, onToast }) {
  const ent = useEntity(cam.entity);
  const path = ent?.attributes?.entity_picture;
  const live = ent && ent.state !== "unavailable";
  const src = useMemo(() => {
    if (!path) return "";
    const url = haAuthUrl(path);
    return url + (url.includes("?") ? "&" : "?") + "t=" + tick;
  }, [path, tick]);

  return (
    <div
      className="cam-tile"
      onClick={() => onToast?.("cctv", cam.name)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onToast?.("cctv", cam.name);
      }}
    >
      {src ? (
        <img src={src} alt={cam.name} onError={(e) => { e.currentTarget.style.display = "none"; }} />
      ) : (
        <div className="cam-fallback">{cam.name}</div>
      )}
      {live && (
        <span className="cam-live-pill">
          <Led tone="critical" pulse />
          LIVE
        </span>
      )}
      <div className="cam-overlay">
        <span className="cam-nm">{cam.name}</span>
        <span className="cam-go">
          <ChevronRight size={16} strokeWidth={2.4} />
        </span>
      </div>
    </div>
  );
}

/**
 * Cameras — 3 stacked landscape tiles (correction 5).
 * Each tile keeps the camera's native landscape aspect (object-fit cover into
 * a landscape box → no vertical squash), filling the left column equally.
 */
export default function CamerasCard({ onToast }) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 6000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="cams rise">
      <div className="cams-head">
        <Cctv size={16} strokeWidth={2} color="var(--gold)" />
        <span className="sect-title">Cameras</span>
      </div>
      <div className="cam-list">
        {ENTITIES.cameras.map((c) => (
          <CamTile key={c.id} cam={c} tick={tick} onToast={onToast} />
        ))}
      </div>
    </div>
  );
}
