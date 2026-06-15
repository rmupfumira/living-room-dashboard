import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import { BedDouble, Lightbulb, Plug, Thermometer, Droplets, Minus, Plus, Volume2, VolumeX, Gauge } from "lucide-react";
import Led from "./Led";
import { HA_URL } from "../ha/client";
import { ENTITIES } from "../entities";
import { useEntity, useHA } from "../ha/HaContext";
import { useService } from "../ha/useService";
import ClimateCard from "./ClimateCard";
import Switch from "./Switch";

const num = (ent) => { const v = Number(ent?.state); return Number.isFinite(v) ? v : NaN; };

/**
 * Live camera with audio.
 *   Primary: HLS (hls.js) at a same-origin URL → nginx proxies /api/hls/ to HA,
 *            so it's CORS-free and carries audio. Autoplay unmuted works on the
 *            kiosk (Chromium --autoplay-policy=no-user-gesture-required).
 *   Fallback: cross-origin MJPEG <img> (live video, no audio) if HLS fails.
 */
function TinoCamera({ entityId }) {
  const { conn, status } = useHA();
  const ent = useEntity(entityId);
  const videoRef = useRef(null);
  const [muted, setMuted] = useState(false);
  const [mode, setMode] = useState("loading"); // loading | hls | mjpeg

  useEffect(() => {
    if (status !== "connected" || !conn) return undefined;
    let hls;
    let alive = true;
    (async () => {
      try {
        const res = await conn.sendMessagePromise({ type: "camera/stream", entity_id: entityId, format: "hls" });
        if (!alive || !res?.url) throw new Error("no stream url");
        const url = res.url.startsWith("http") ? res.url : window.location.origin + res.url;
        const video = videoRef.current;
        if (!video) return;
        if (video.canPlayType("application/vnd.apple.mpegurl")) {
          video.src = url; // native HLS (Safari)
        } else if (Hls.isSupported()) {
          hls = new Hls({ enableWorker: true, lowLatencyMode: true, backBufferLength: 10 });
          hls.on(Hls.Events.ERROR, (_e, data) => { if (data?.fatal && alive) setMode("mjpeg"); });
          hls.loadSource(url);
          hls.attachMedia(video);
        } else {
          setMode("mjpeg");
          return;
        }
        setMode("hls");
        video.play().catch(() => { video.muted = true; setMuted(true); video.play().catch(() => {}); });
      } catch {
        if (alive) setMode("mjpeg");
      }
    })();
    return () => { alive = false; if (hls) { try { hls.destroy(); } catch {} } };
  }, [conn, status, entityId]);

  const token = (ent?.attributes?.entity_picture || "").split("token=")[1];
  const mjpeg = token ? `${HA_URL}/api/camera_proxy_stream/${entityId}?token=${token}` : "";

  return (
    <div className="tino-cam">
      {mode === "mjpeg" ? (
        mjpeg ? <img src={mjpeg} alt="Tinotenda camera" /> : <div className="cam-fallback">Camera unavailable</div>
      ) : (
        <video ref={videoRef} autoPlay playsInline muted={muted} />
      )}
      <span className="cam-live-pill"><Led tone="critical" pulse />LIVE</span>
      {mode === "hls" && (
        <button
          type="button"
          className="tino-mute"
          onClick={() => { const v = videoRef.current; if (v) { v.muted = !v.muted; setMuted(v.muted); } }}
          aria-label={muted ? "Unmute" : "Mute"}
        >
          {muted ? <VolumeX size={22} strokeWidth={2} /> : <Volume2 size={22} strokeWidth={2} />}
        </button>
      )}
    </div>
  );
}

function ToggleControl({ id, name, Icon, onToast }) {
  const ent = useEntity(id);
  const call = useService();
  const on = ent?.state === "on";
  const unavail = !ent || ent.state === "unavailable";
  return (
    <div className={"tino-ctl" + (on ? " on" : "")}>
      <Icon size={20} strokeWidth={2} className="tino-ctl-ic" />
      <span className="tino-ctl-n">{name}</span>
      <Switch
        on={on}
        disabled={unavail}
        ariaLabel={name}
        onClick={() => { if (!unavail) { onToast?.("bolt", `${name} ${on ? "off" : "on"}`); call(id.split(".")[0], "toggle", {}, { entity_id: id }); } }}
      />
    </div>
  );
}

function TempRange({ T }) {
  const minEnt = useEntity(T.minTemp);
  const maxEnt = useEntity(T.maxTemp);
  const call = useService();
  const min = num(minEnt);
  const max = num(maxEnt);
  const adj = (id, cur, d) => { if (Number.isFinite(cur)) call("input_number", "set_value", { value: cur + d }, { entity_id: id }); };
  const Row = ({ label, id, val }) => (
    <div className="tino-range-row">
      <span className="tino-range-l">{label}</span>
      <button type="button" onClick={() => adj(id, val, -1)} aria-label="lower"><Minus size={16} strokeWidth={2.4} /></button>
      <b className="tabular">{Number.isFinite(val) ? Math.round(val) : "—"}°</b>
      <button type="button" onClick={() => adj(id, val, 1)} aria-label="raise"><Plus size={16} strokeWidth={2.4} /></button>
    </div>
  );
  return (
    <div className="tino-range">
      <Row label="Min" id={T.minTemp} val={min} />
      <Row label="Max" id={T.maxTemp} val={max} />
    </div>
  );
}

/** Tinotenda's room — his camera commands the view, controls on the right. */
export default function TinotendaView({ onToast }) {
  const T = ENTITIES.tinotenda;
  const t = num(useEntity(T.temp));
  const h = num(useEntity(T.humidity));

  return (
    <div className="sysview">
      <div className="sv-head">
        <BedDouble size={18} strokeWidth={2} color="var(--gold)" />
        <span className="sect-title">Tinotenda</span>
        <span className="sv-pill" style={{ marginLeft: "auto" }}>
          <Thermometer size={14} strokeWidth={2.2} /> {Number.isFinite(t) ? t.toFixed(1) : "—"}°
        </span>
        <span className="sv-pill">
          <Droplets size={14} strokeWidth={2.2} /> {Number.isFinite(h) ? Math.round(h) : "—"}%
        </span>
      </div>

      <div className="tino-grid">
        <TinoCamera entityId={T.camera} />

        <div className="tino-side">
          <ClimateCard acEntity={T.ac} tempEntity={T.temp} onToast={onToast} />
          <div className="tino-controls">
            <div className="tino-ctl-h">Room controls</div>
            <ToggleControl id={T.light} name="Light" Icon={Lightbulb} onToast={onToast} />
            <ToggleControl id={T.acPower} name="AC Power" Icon={Plug} onToast={onToast} />
            <ToggleControl id={T.autoTemp} name="Auto Temp" Icon={Gauge} onToast={onToast} />
            <TempRange T={T} />
          </div>
        </div>
      </div>
    </div>
  );
}
