import { useEffect, useState } from "react";
import { fmtTime } from "../lib/format";

/**
 * Big digital clock card (span 3).
 * Pure display — no controls, no entity binding, just a ticking clock.
 */
export default function ClockCard() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const t = fmtTime(now);
  const dayName = now.toLocaleDateString("en-GB", { weekday: "long" });
  const dateStr = now.toLocaleDateString("en-GB", { day: "numeric", month: "long" });

  return (
    <div className="span-clock" style={{ gridColumn: "span 3" }}>
      <div className="card rise clock-card">
        <div className="cc-day mlabel">{dayName}</div>
        <div className="cc-time">
          <span className="cc-hm">{t.slice(0, 5)}</span>
          <span className="cc-ss">{t.slice(6)}</span>
        </div>
        <div className="cc-date mlabel">{dateStr}</div>
      </div>
    </div>
  );
}
