import { useEffect, useMemo, useState } from "react";
import * as L from "lucide-react";
import { Cctv, Maximize2, X } from "lucide-react";
import Led from "./Led";
import { ENTITIES } from "../entities";
import { useEntity } from "../ha/HaContext";
import { haAuthUrl } from "../ha/useService";

function toPascal(name) {
  return String(name).split(/[-_]/).map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join("");
}

/** Authed snapshot URL for a camera, refreshed by `tick`. */
function useSnapshot(entity, tick) {
  const ent = useEntity(entity);
  const path = ent?.attributes?.entity_picture;
  const live = ent && ent.state !== "unavailable";
  const src = useMemo(() => {
    if (!path) return "";
    const u = haAuthUrl(path);
    return u + (u.includes("?") ? "&" : "?") + "t=" + tick;
  }, [path, tick]);
  return { src, live };
}

function CamTabs({ cams, sel, onPick, className }) {
  return (
    <div className={className}>
      {cams.map((c) => {
        const Icon = L[toPascal(c.icon)] || Cctv;
        return (
          <button type="button" key={c.id} className={"dbl-tab" + (c.id === sel ? " on" : "")} onClick={() => onPick(c)}>
            <Icon size={18} strokeWidth={2} />
            {c.name}
          </button>
        );
      })}
    </div>
  );
}

/** Full-screen camera popup (any of the kitchen cameras, switchable). */
function CameraModal({ cams, sel, setSel, onClose }) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1500); // near-live
    return () => clearInterval(id);
  }, []);
  const cam = cams.find((c) => c.id === sel) || cams[0];
  const { src, live } = useSnapshot(cam.entity, tick);

  return (
    <div className="cam-modal" role="dialog" aria-label={cam.name} onClick={onClose}>
      <div className="cam-modal-inner" onClick={(e) => e.stopPropagation()}>
        <div className="cam-modal-h">
          <span><Cctv size={20} strokeWidth={2} /> {cam.name}</span>
          <button type="button" className="cam-modal-x" onClick={onClose} aria-label="Close"><X size={22} strokeWidth={2.4} /></button>
        </div>
        <div className="cam-modal-view">
          {src ? <img src={src} alt={cam.name} onError={(e) => { e.currentTarget.style.display = "none"; }} /> : <div className="cam-fallback">{cam.name}</div>}
          {live && <span className="cam-live-pill"><Led tone="critical" pulse />LIVE</span>}
        </div>
        <CamTabs cams={cams} sel={sel} onPick={(c) => setSel(c.id)} className="dbl-tabs" />
      </div>
    </div>
  );
}

/**
 * Kitchen doorbell / camera card. Shows one live camera; the tab buttons
 * switch the feed; the expand button opens a full-screen popup.
 */
export default function DoorbellCard({ onToast }) {
  const cams = ENTITIES.cameras;
  const [sel, setSel] = useState(cams[0].id);
  const [full, setFull] = useState(false);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 6000);
    return () => clearInterval(id);
  }, []);

  const cam = cams.find((c) => c.id === sel) || cams[0];
  const { src, live } = useSnapshot(cam.entity, tick);

  const pick = (c) => { setSel(c.id); onToast?.("cctv", c.name); };

  return (
    <div className="dbl rise">
      <div className="dbl-h">
        <span className="sect-title">Doorbell</span>
        {live && <span className="dbl-live"><Led tone="critical" pulse />LIVE</span>}
      </div>

      <div className="dbl-view" onClick={() => setFull(true)} role="button" tabIndex={0}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setFull(true); }}>
        {src ? <img src={src} alt={cam.name} onError={(e) => { e.currentTarget.style.display = "none"; }} /> : <div className="cam-fallback">{cam.name}</div>}
        <button type="button" className="dbl-expand" onClick={(e) => { e.stopPropagation(); setFull(true); }} aria-label="Full screen">
          <Maximize2 size={18} strokeWidth={2.2} />
        </button>
      </div>

      <CamTabs cams={cams} sel={sel} onPick={pick} className="dbl-tabs" />

      {full && <CameraModal cams={cams} sel={sel} setSel={setSel} onClose={() => setFull(false)} />}
    </div>
  );
}
