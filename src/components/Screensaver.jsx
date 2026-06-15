import { useEffect, useState } from "react";
import { Sun, Moon, Cloud, CloudRain, CloudSnow, CloudLightning, CloudFog, CloudSun, Wind, Snowflake } from "lucide-react";
import { ENTITIES } from "../entities";
import { useEntity } from "../ha/HaContext";

const COND = {
  "clear-night": Moon, cloudy: Cloud, fog: CloudFog, hail: CloudSnow,
  lightning: CloudLightning, "lightning-rainy": CloudLightning, partlycloudy: CloudSun,
  pouring: CloudRain, rainy: CloudRain, snowy: Snowflake, "snowy-rainy": CloudSnow,
  sunny: Sun, windy: Wind, "windy-variant": Wind,
};
const condIcon = (s) => COND[s] || Cloud;
const condLabel = (s) => (s || "").replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

/**
 * Idle clock screensaver. Fills the screen with a big digital clock; any tap
 * (or keypress) wakes back to the dashboard. Mounted only while idle.
 */
export default function Screensaver({ onWake }) {
  const [now, setNow] = useState(() => new Date());
  const weather = useEntity(ENTITIES.weather);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // Keyboard wake (pointer is handled by the overlay's onClick so the waking
  // tap is fully consumed and can't fall through to a control underneath).
  useEffect(() => {
    const wake = () => onWake();
    window.addEventListener("keydown", wake, true);
    return () => window.removeEventListener("keydown", wake, true);
  }, [onWake]);

  const hh = now.getHours();
  const h12 = ((hh + 11) % 12) + 1;
  const mm = String(now.getMinutes()).padStart(2, "0");
  const ampm = hh < 12 ? "AM" : "PM";
  const dateStr = now.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });

  const cond = weather?.state;
  const WIcon = condIcon(cond);
  const temp = Number.isFinite(weather?.attributes?.temperature) ? Math.round(weather.attributes.temperature) : null;

  return (
    <div className="saver" onClick={onWake} role="button" tabIndex={0} aria-label="Wake dashboard">
      <div className="saver-clock tabular">
        <span>{h12}</span><span className="saver-colon">:</span><span>{mm}</span>
        <span className="saver-ampm">{ampm}</span>
      </div>
      <div className="saver-date">{dateStr}</div>
      {weather && (
        <div className="saver-wx">
          <WIcon size={26} strokeWidth={1.6} />
          {temp != null && <span className="saver-wx-t">{temp}°</span>}
          {cond && <span className="saver-wx-c">{condLabel(cond)}</span>}
        </div>
      )}
      <div className="saver-hint">Tap anywhere to open the dashboard</div>
    </div>
  );
}
