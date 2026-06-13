import { useMemo } from "react";
import { Sun, Moon, Cloud, CloudRain, CloudSnow, CloudLightning, CloudFog, CloudSun, Wind, Snowflake, X, Droplets, Gauge, Eye, MapPin } from "lucide-react";
import { ENTITIES } from "../entities";
import { useEntity } from "../ha/HaContext";
import { useForecast } from "../ha/useForecast";

const COND = {
  "clear-night": Moon, cloudy: Cloud, fog: CloudFog, hail: CloudSnow,
  lightning: CloudLightning, "lightning-rainy": CloudLightning, partlycloudy: CloudSun,
  pouring: CloudRain, rainy: CloudRain, snowy: Snowflake, "snowy-rainy": CloudSnow,
  sunny: Sun, windy: Wind, "windy-variant": Wind,
};
const condIcon = (s) => COND[s] || Cloud;
const condLabel = (s) => (s || "—").replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
const dayShort = (iso) => (iso ? new Date(iso).toLocaleDateString("en-GB", { weekday: "short" }).toUpperCase() : "—");

/** Weather detail popup — current conditions + stats + 7-day forecast. */
export default function WeatherModal({ open, onClose }) {
  const ent = useEntity(ENTITIES.weather);
  const forecast = useForecast(ENTITIES.weather, "daily");
  const a = ent?.attributes || {};
  const cond = ent?.state || "—";
  const Icon = condIcon(cond);
  const temp = Number.isFinite(a.temperature) ? Math.round(a.temperature) : "—";
  const days = useMemo(() => forecast.slice(0, 7), [forecast]);

  if (!open) return null;

  const stats = [
    { Ic: Droplets, k: "Humidity", v: Number.isFinite(a.humidity) ? Math.round(a.humidity) : "—", u: "%" },
    { Ic: Wind, k: "Wind", v: Number.isFinite(a.wind_speed) ? Math.round(a.wind_speed) : "—", u: "km/h" },
    { Ic: Gauge, k: "Pressure", v: Number.isFinite(a.pressure) ? Math.round(a.pressure) : "—", u: "hPa" },
    { Ic: Eye, k: "Visibility", v: Number.isFinite(a.visibility) ? a.visibility.toFixed(0) : "—", u: "km" },
  ];

  return (
    <div className="wx-backdrop" onClick={onClose}>
      <div className="wx-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Weather">
        <button type="button" className="wx-close" onClick={onClose} aria-label="Close">
          <X size={20} strokeWidth={2} />
        </button>

        <div className="wx-now">
          <div className="wx-now-ic"><Icon size={80} strokeWidth={1.4} /></div>
          <div>
            <div className="wx-loc"><MapPin size={13} strokeWidth={2} /><span>{a.friendly_name || "Home"}</span></div>
            <div className="wx-temp tabular">{temp}°</div>
            <div className="wx-cond">{condLabel(cond)}</div>
          </div>
        </div>

        <div className="wx-stats">
          {stats.map((s) => (
            <div key={s.k} className="wx-stat">
              <div className="wx-stat-ic"><s.Ic size={16} strokeWidth={2} /></div>
              <div>
                <div className="wx-stat-v tabular">{s.v}<span className="u">{s.u}</span></div>
                <div className="wx-stat-k">{s.k}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="wx-forecast-h">Next {Math.max(days.length, 7)} days</div>
        <div className="wx-forecast">
          {(days.length ? days : Array.from({ length: 7 }, () => null)).map((d, i) => {
            if (!d) {
              return (
                <div key={i} className="wx-day" style={{ opacity: 0.35 }}>
                  <span className="wx-day-d">—</span>
                  <Cloud size={24} strokeWidth={1.5} color="var(--ink-faint)" />
                  <span className="wx-day-hi">—</span>
                </div>
              );
            }
            const DIcon = condIcon(d.condition);
            const hi = Number.isFinite(d.temperature) ? Math.round(d.temperature) : "—";
            const lo = Number.isFinite(d.templow) ? Math.round(d.templow) : null;
            return (
              <div key={i} className={"wx-day" + (i === 0 ? " today" : "")}>
                <span className="wx-day-d">{i === 0 ? "TODAY" : dayShort(d.datetime)}</span>
                <DIcon size={26} strokeWidth={1.5} color={i === 0 ? "var(--gold)" : "var(--ink-soft)"} />
                <span className="wx-day-hi">{hi}°</span>
                {lo != null && <span className="wx-day-lo">{lo}°</span>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
