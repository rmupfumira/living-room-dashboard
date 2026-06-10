import * as L from "lucide-react";
import { CloudRain } from "lucide-react";

function toPascal(name) {
  return name
    .split(/[-_]/)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join("");
}

/**
 * Weather card — top-right of the hero row. Date label, big temp, condition,
 * mono H/L+rain meta, and a pinned 5-day forecast strip.
 */
export default function WeatherCard({ weather }) {
  return (
    <div className="card rise weather" style={{ gridColumn: "span 3" }}>
      <div className="weather-top">
        <div style={{ minWidth: 0 }}>
          <span className="mlabel">{weather.date}</span>
          <div className="weather-temp">{weather.temp}°</div>
          <div className="weather-cond">{weather.cond}</div>
          <div className="weather-meta">
            H {weather.high}° · L {weather.low}° · {weather.rain}% rain
          </div>
        </div>
        <div className="weather-ic">
          <CloudRain size={26} strokeWidth={2} />
        </div>
      </div>

      <div className="forecast">
        {weather.forecast.map((f, i) => {
          const Icon = L[toPascal(f.icon)] || L.Sun;
          return (
            <div key={f.day} className={"fday" + (i === 0 ? " today" : "")}>
              <span className="fd">{f.day}</span>
              <Icon size={16} strokeWidth={2} color={i === 0 ? "var(--argon)" : "var(--ink-soft)"} />
              <span className="fh">{f.hi}°</span>
              <span className="fl">{f.lo}°</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
