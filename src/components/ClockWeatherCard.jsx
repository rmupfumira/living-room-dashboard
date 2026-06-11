import { useEffect, useState } from "react";
import * as L from "lucide-react";
import { Sun, Moon, Cloud, CloudRain, CloudSnow, CloudLightning, CloudFog, CloudSun, Wind, Snowflake, Droplets, Gauge, Eye, Compass } from "lucide-react";
import { ENTITIES } from "../entities";
import { useEntity } from "../ha/HaContext";
import { fmtTime } from "../lib/format";

/* HA weather state → lucide icon mapping. */
const COND_ICONS = {
  "clear-night": Moon,
  cloudy: Cloud,
  exceptional: L.AlertTriangle,
  fog: CloudFog,
  hail: CloudSnow,
  lightning: CloudLightning,
  "lightning-rainy": CloudLightning,
  partlycloudy: CloudSun,
  pouring: CloudRain,
  rainy: CloudRain,
  snowy: Snowflake,
  "snowy-rainy": CloudSnow,
  sunny: Sun,
  windy: Wind,
  "windy-variant": Wind,
};

/** Convert wind bearing (0-360) to cardinal abbreviation. */
function bearingToCardinal(deg) {
  if (deg == null || !Number.isFinite(deg)) return "";
  const dirs = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
  return dirs[Math.round(deg / 22.5) % 16];
}

const condLabel = (state) =>
  (state || "—")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

export default function ClockWeatherCard() {
  const ent = useEntity(ENTITIES.weather);

  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const t = fmtTime(now);
  const hm = t.slice(0, 5);
  const ss = t.slice(6);
  const dayName = now.toLocaleDateString("en-GB", { weekday: "long" });
  const dateStr = now.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

  const a = ent?.attributes || {};
  const cond = ent?.state || "—";
  const Icon = COND_ICONS[cond] || Cloud;
  const temp = Number.isFinite(a.temperature) ? Math.round(a.temperature) : null;
  const tempPrecise = Number.isFinite(a.temperature) ? a.temperature.toFixed(1) : null;
  const humidity = Number.isFinite(a.humidity) ? Math.round(a.humidity) : null;
  const wind = Number.isFinite(a.wind_speed) ? Math.round(a.wind_speed) : null;
  const windDir = bearingToCardinal(a.wind_bearing);
  const pressure = Number.isFinite(a.pressure) ? Math.round(a.pressure) : null;
  const visibility = Number.isFinite(a.visibility) ? a.visibility.toFixed(1) : null;
  const unavail = !ent || ent.state === "unavailable";

  return (
    <div className="span-doorbell" style={{ gridColumn: "span 8" }}>
      <div className="card rise cw">
        {/* ── LEFT: Clock ── */}
        <div className="cw-clock">
          <div className="cw-day mlabel">{dayName} · {dateStr}</div>
          <div className="cw-time">
            <span className="cw-hm">{hm}</span>
            <span className="cw-ss">:{ss}</span>
          </div>
          <div className="cw-tz mlabel">Africa / Johannesburg</div>
        </div>

        {/* ── DIVIDER ── */}
        <div className="cw-divider" aria-hidden="true" />

        {/* ── RIGHT: Weather ── */}
        <div className="cw-weather">
          <div className="cw-w-head">
            <span className="mlabel">{a.friendly_name || "Weather"}</span>
            <span className="glass-pill live">
              <span className="led" />
              LIVE
            </span>
          </div>

          <div className="cw-w-main">
            <div className={"cw-w-ic" + (unavail ? " unavail" : "")}>
              <Icon size={64} strokeWidth={1.3} />
            </div>
            <div className="cw-w-temp-wrap">
              <div className="cw-w-temp">
                {temp != null ? temp : "—"}
                <span className="u">°C</span>
              </div>
              <div className="cw-w-cond">{condLabel(cond)}</div>
              {tempPrecise && <div className="mlabel" style={{ marginTop: 4 }}>Feels like {tempPrecise}°</div>}
            </div>
          </div>

          <div className="cw-w-stats">
            <div className="cw-stat">
              <div className="cw-stat-ic"><Droplets size={14} strokeWidth={2} /></div>
              <div>
                <div className="cw-stat-v">{humidity != null ? humidity : "—"}%</div>
                <div className="mlabel">Humidity</div>
              </div>
            </div>
            <div className="cw-stat">
              <div className="cw-stat-ic"><Wind size={14} strokeWidth={2} /></div>
              <div>
                <div className="cw-stat-v">{wind != null ? wind : "—"} <span className="u">km/h</span></div>
                <div className="mlabel">Wind {windDir}</div>
              </div>
            </div>
            <div className="cw-stat">
              <div className="cw-stat-ic"><Gauge size={14} strokeWidth={2} /></div>
              <div>
                <div className="cw-stat-v">{pressure != null ? pressure : "—"} <span className="u">hPa</span></div>
                <div className="mlabel">Pressure</div>
              </div>
            </div>
            <div className="cw-stat">
              <div className="cw-stat-ic"><Eye size={14} strokeWidth={2} /></div>
              <div>
                <div className="cw-stat-v">{visibility != null ? visibility : "—"} <span className="u">km</span></div>
                <div className="mlabel">Visibility</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
