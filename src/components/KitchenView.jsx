import {
  Sun, Moon, Cloud, CloudRain, CloudSnow, CloudLightning, CloudFog, CloudSun, Wind, Snowflake,
  ShieldCheck, ShieldAlert, ChevronRight,
} from "lucide-react";
import { ENTITIES, ALERT_SENSORS } from "../entities";
import { useEntity, useHA } from "../ha/HaContext";
import MusicCard from "./MusicCard";
import DoorbellCard from "./DoorbellCard";
import LightingCard from "./LightingCard";

const COND = {
  "clear-night": Moon, cloudy: Cloud, fog: CloudFog, hail: CloudSnow, lightning: CloudLightning,
  "lightning-rainy": CloudLightning, partlycloudy: CloudSun, pouring: CloudRain, rainy: CloudRain,
  snowy: Snowflake, "snowy-rainy": CloudSnow, sunny: Sun, windy: Wind, "windy-variant": Wind,
};
const condLabel = (s) => (s || "—").replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

/** Compact security status card — mirrors the status bar's secure/attention state. */
function SecuritySummary({ onOpen }) {
  const { entities } = useHA();
  const S = ENTITIES.security;
  const e = (id) => entities[id];
  const isOpen = (x) => x && /^(open|opening)$/i.test(x.state);
  const isArmed = (x) => x && /^armed/i.test(x.state);
  const isLocked = (x) => x && x.state === "locked";
  const armed = isArmed(e(S.outdoorAlarm));
  const allClosed = !isOpen(e(S.garage)) && !isOpen(e(S.gate)) && !isOpen(e(S.screenGate)) && isLocked(e(S.entArea)) && isLocked(e(S.frontDoorLock));
  const hasCritical = ALERT_SENSORS.some((s) => s.class === "critical" && entities[s.id]?.state === "on");
  const secure = armed && allClosed && !hasCritical;

  return (
    <div className={"ksum ksum-sec" + (secure ? " secure" : " attn")} onClick={onOpen} role="button" tabIndex={0}
      onKeyDown={(ev) => { if (ev.key === "Enter" || ev.key === " ") onOpen?.(); }}>
      <div className="ksum-h">Security</div>
      <div className="ksum-body">
        <div className="ksum-ic">{secure ? <ShieldCheck size={34} strokeWidth={2} /> : <ShieldAlert size={34} strokeWidth={2} />}</div>
        <div className="ksum-t">{secure ? "Home Secure" : "Attention"}</div>
        <div className="ksum-s">{secure ? "All systems normal" : armed ? "Something is open" : "Disarmed"}</div>
      </div>
    </div>
  );
}

/** Compact weather card — opens the full weather view. */
function WeatherSummary({ onOpen }) {
  const w = useEntity(ENTITIES.weather);
  const cond = w?.state || "—";
  const WIcon = COND[cond] || Cloud;
  const temp = Number.isFinite(w?.attributes?.temperature) ? Math.round(w.attributes.temperature) : "—";
  const hi = w?.attributes?.temp_high ?? w?.attributes?.forecast?.[0]?.temperature;
  const lo = w?.attributes?.temp_low ?? w?.attributes?.forecast?.[0]?.templow;

  return (
    <div className="ksum ksum-weather" onClick={onOpen} role="button" tabIndex={0}
      onKeyDown={(ev) => { if (ev.key === "Enter" || ev.key === " ") onOpen?.(); }}>
      <div className="ksum-h">Weather</div>
      <div className="ksum-wx">
        <WIcon size={56} strokeWidth={1.6} className="ksum-wx-ic" />
        <div>
          <div className="ksum-wx-temp tabular">{temp}°</div>
          <div className="ksum-wx-cond">{condLabel(cond)}</div>
          {Number.isFinite(hi) && Number.isFinite(lo) && (
            <div className="ksum-wx-hl tabular">H: {Math.round(hi)}°&nbsp;&nbsp;L: {Math.round(lo)}°</div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Kitchen tab body — sits between the status bar and the scenes row.
 *   Top:    Now Playing (Music Assistant) │ Doorbell (switchable cameras)
 *   Bottom: Kitchen Lighting │ Security │ Weather
 */
export default function KitchenView({ onToast, onOpenLighting, onOpenSecurity, onOpenWeather }) {
  return (
    <div className="kv">
      <div className="kv-top">
        <MusicCard onToast={onToast} />
        <DoorbellCard onToast={onToast} />
      </div>
      <div className="kv-bottom">
        <LightingCard config={ENTITIES.lighting.kitchen} onToast={onToast} onOpenLighting={onOpenLighting} />
        <SecuritySummary onOpen={onOpenSecurity} />
        <WeatherSummary onOpen={onOpenWeather} />
      </div>
    </div>
  );
}
