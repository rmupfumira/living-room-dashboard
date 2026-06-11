import { useMemo } from "react";
import { Sun, Moon, Cloud, CloudRain, CloudSnow, CloudLightning, CloudFog, CloudSun, Wind, Snowflake, MapPin, Droplets, Gauge, Eye, Compass } from "lucide-react";
import { ENTITIES } from "../entities";
import { useEntity } from "../ha/HaContext";
import { useForecast } from "../ha/useForecast";

/** HA weather state → lucide icon + tint color. */
const COND = {
  "clear-night": { Icon: Moon, color: "#cbd5ff" },
  cloudy: { Icon: Cloud, color: "#c8cad6" },
  exceptional: { Icon: Wind, color: "#ff4d6d" },
  fog: { Icon: CloudFog, color: "#9ca3b5" },
  hail: { Icon: CloudSnow, color: "#a8d4f0" },
  lightning: { Icon: CloudLightning, color: "#b288ff" },
  "lightning-rainy": { Icon: CloudLightning, color: "#b288ff" },
  partlycloudy: { Icon: CloudSun, color: "#ffc46b" },
  pouring: { Icon: CloudRain, color: "#38a3ff" },
  rainy: { Icon: CloudRain, color: "#38a3ff" },
  snowy: { Icon: Snowflake, color: "#e8f0ff" },
  "snowy-rainy": { Icon: CloudSnow, color: "#a8d4f0" },
  sunny: { Icon: Sun, color: "#ffc46b" },
  windy: { Icon: Wind, color: "#46e0d2" },
  "windy-variant": { Icon: Wind, color: "#46e0d2" },
};

const condInfo = (state) => COND[state] || { Icon: Cloud, color: "#c8cad6" };
const condLabel = (state) =>
  (state || "—")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

/** Convert wind bearing (0–360°) to a cardinal abbreviation, e.g. 345 → 'NNW'. */
function bearingToCardinal(deg) {
  if (deg == null || !Number.isFinite(deg)) return "";
  const dirs = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
  return dirs[Math.round(deg / 22.5) % 16];
}

/** "Wed", "Thu", … from an HA datetime string. */
function dayShort(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", { weekday: "short" });
}

export default function WeatherCard() {
  const ent = useEntity(ENTITIES.weather);
  const forecast = useForecast(ENTITIES.weather, "daily");

  const a = ent?.attributes || {};
  const cond = ent?.state || "—";
  const { Icon, color } = condInfo(cond);
  const tempInt = Number.isFinite(a.temperature) ? Math.round(a.temperature) : null;
  const unavail = !ent || cond === "unavailable";

  // Live conditions for the stats strip.
  const humidity = Number.isFinite(a.humidity) ? Math.round(a.humidity) : null;
  const wind = Number.isFinite(a.wind_speed) ? Math.round(a.wind_speed) : null;
  const windDir = bearingToCardinal(a.wind_bearing);
  const pressure = Number.isFinite(a.pressure) ? Math.round(a.pressure) : null;
  const visibility = Number.isFinite(a.visibility) ? a.visibility.toFixed(1) : null;

  // Take up to 7 days. Some integrations include today as forecast[0], some don't.
  const days = useMemo(() => forecast.slice(0, 7), [forecast]);

  return (
    <div className="span-weather" style={{ gridColumn: "span 5" }}>
      <div className="card rise weather-card">
        {/* ── Head: title + location ── */}
        <div className="wc-head">
          <div className="card-title">Weather</div>
          <div className="wc-loc">
            <MapPin size={12} strokeWidth={2} />
            <span className="mlabel">{a.friendly_name || "Home"}</span>
          </div>
        </div>

        {/* ── Hero: temperature + condition icon ── */}
        <div className="wc-hero">
          <div className="wc-hero-left">
            <div className="wc-temp">
              {tempInt != null ? tempInt : "—"}
              <span className="u">°</span>
            </div>
            <div className="wc-cond">{condLabel(cond)}</div>
          </div>
          <div className={"wc-hero-ic" + (unavail ? " unavail" : "")} style={{ color }}>
            <Icon size={100} strokeWidth={1.3} />
          </div>
        </div>

        {/* ── Compact stats strip ── */}
        <div className="wc-stats">
          <div className="wc-stat">
            <div className="wc-stat-ic" style={{ color: "#38a3ff" }}>
              <Droplets size={14} strokeWidth={2} />
            </div>
            <div>
              <div className="wc-stat-v">{humidity != null ? `${humidity}%` : "—"}</div>
              <div className="wc-stat-l">Humidity</div>
            </div>
          </div>
          <div className="wc-stat">
            <div className="wc-stat-ic" style={{ color: "#46e0d2" }}>
              <Wind size={14} strokeWidth={2} />
            </div>
            <div>
              <div className="wc-stat-v">
                {wind != null ? wind : "—"}
                <span className="u">km/h</span>
              </div>
              <div className="wc-stat-l">Wind {windDir}</div>
            </div>
          </div>
          <div className="wc-stat">
            <div className="wc-stat-ic" style={{ color: "#b8f24a" }}>
              <Gauge size={14} strokeWidth={2} />
            </div>
            <div>
              <div className="wc-stat-v">
                {pressure != null ? pressure : "—"}
                <span className="u">hPa</span>
              </div>
              <div className="wc-stat-l">Pressure</div>
            </div>
          </div>
          <div className="wc-stat">
            <div className="wc-stat-ic" style={{ color: "#ffc46b" }}>
              <Eye size={14} strokeWidth={2} />
            </div>
            <div>
              <div className="wc-stat-v">
                {visibility != null ? visibility : "—"}
                <span className="u">km</span>
              </div>
              <div className="wc-stat-l">Visibility</div>
            </div>
          </div>
        </div>

        {/* ── Forecast strip ── */}
        <div className="wc-forecast-head">
          <span className="mlabel">Forecast</span>
          <span className="mlabel" style={{ color: "var(--ink-faint)" }}>
            Next {Math.max(days.length, 7)} days
          </span>
        </div>
        <div className="wc-forecast">
          {days.length === 0
            ? Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="wc-day wc-day-skel">
                  <span className="wc-day-name">—</span>
                  <Cloud size={22} strokeWidth={1.4} color="var(--ink-faint)" />
                  <span className="wc-day-t">—°</span>
                </div>
              ))
            : days.map((d, i) => {
                const { Icon: DIcon, color: dColor } = condInfo(d.condition);
                const hi = Number.isFinite(d.temperature) ? Math.round(d.temperature) : null;
                return (
                  <div key={i} className="wc-day">
                    <span className="wc-day-name">{i === 0 ? "Today" : dayShort(d.datetime)}</span>
                    <DIcon size={22} strokeWidth={1.4} color={dColor} />
                    <span className="wc-day-t">{hi != null ? `${hi}°` : "—"}</span>
                  </div>
                );
              })}
        </div>
      </div>
    </div>
  );
}
