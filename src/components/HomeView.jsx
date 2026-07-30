import { useEffect, useState } from "react";
import { Wifi, WifiOff, Bell, ShieldCheck, ShieldAlert, Sofa, ChefHat, BedDouble, Video, Cloud } from "lucide-react";
import { ENTITIES, ALERT_SENSORS } from "../entities";
import { useHA } from "../ha/HaContext";
import SecurityControls from "./SecurityControls";
import SolarCard from "./SolarCard";
import GeyserCard from "./GeyserCard";
import LightingCard from "./LightingCard";
import ScenesBar from "./ScenesBar";
import LaundryStatus from "./LaundryStatus";

const greetingFor = (h) => (h < 12 ? "Good Morning" : h < 17 ? "Good Afternoon" : h < 21 ? "Good Evening" : "Good Night");
const numv = (ent) => { const v = Number(ent?.state); return Number.isFinite(v) ? v : NaN; };

/** Secure/available for one control, mirroring SecurityControls' statusOf. */
function secStatus(kind, state) {
  const unavail = !state || state === "unavailable";
  if (kind === "alarm") return { secure: /^armed/i.test(state || ""), unavail };
  if (kind === "cover") return { secure: !/^(open|opening)$/i.test(state || ""), unavail };
  if (kind === "gate") return { secure: (state || "").toLowerCase() === "closed", unavail };
  return { secure: state === "locked", unavail };
}

/**
 * Home — the one-screen command center (Option 10). A common-area header
 * (time-aware greeting, big clock, live security verdict), a room-nav row,
 * and the security / geyser / lighting / energy / laundry cards composed in a
 * three-column body with the scenes footer. All depth stays behind the rail.
 */
export default function HomeView({ onToast, onOpenSecurity, navigate }) {
  const { status, entities } = useHA();
  const [now, setNow] = useState(() => new Date());
  useEffect(() => { const id = setInterval(() => setNow(new Date()), 20000); return () => clearInterval(id); }, []);

  const hh = now.getHours();
  const mm = String(now.getMinutes()).padStart(2, "0");
  const HH = String(hh).padStart(2, "0");
  const dateStr = now.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" }).toUpperCase();
  const connected = status === "connected";

  // Live security verdict (indoor alarm excluded, like SecurityControls).
  const watched = ENTITIES.securityControls.filter((c) => !c.ignore);
  const openItems = watched.filter((c) => {
    const s = secStatus(c.kind, entities[c.statusEntity || c.entity]?.state);
    return !s.secure && !s.unavail;
  });
  const secure = openItems.length === 0;
  const alertCount = ALERT_SENSORS.filter((a) => entities[a.id]?.state === "on").length;

  // Weather + a couple of room temps for the nav row.
  const wx = entities[ENTITIES.weather];
  const outTemp = numv(wx) || Number(wx?.attributes?.temperature);
  const livingTemp = numv(entities[ENTITIES.climate.living.temp]);
  const tinoTemp = numv(entities[ENTITIES.tinotenda.temp]);
  const livingLightsOn = entities["light.living_room_lights_rgb"]?.state === "on";

  const rooms = [
    { id: "living", name: "Living Room", Icon: Sofa, stat: Number.isFinite(livingTemp) ? `${Math.round(livingTemp)}°` : (livingLightsOn ? "Lights on" : "—"), path: "/living-room" },
    { id: "kitchen", name: "Kitchen", Icon: ChefHat, stat: "Ambience", path: "/kitchen" },
    { id: "tinotenda", name: "Tinotenda", Icon: BedDouble, stat: Number.isFinite(tinoTemp) ? `${Math.round(tinoTemp)}°` : "—", path: "/tinotenda" },
    { id: "cameras", name: "Cameras", Icon: Video, stat: "8 feeds", path: "/cameras" },
  ];

  return (
    <div className="home">
      <header className="home-head">
        <div>
          <div className="home-greet">{greetingFor(hh)}</div>
          <div className="home-date">{dateStr}</div>
          <button type="button" className={"hx-verdict " + (secure ? "ok" : "warn")} onClick={onOpenSecurity}>
            {secure ? <ShieldCheck size={18} strokeWidth={2.4} /> : <ShieldAlert size={18} strokeWidth={2.4} />}
            <span className="hx-verdict-t">{secure ? "Home Secure" : `${openItems.length} open`}</span>
            <span className="hx-verdict-s">{secure ? "All systems normal" : openItems.map((c) => c.name).join(", ")}</span>
          </button>
        </div>
        <div className="hx-headright">
          <div className="hx-clock tabular">{HH}:{mm}</div>
          <div className="home-status">
            <span className="hx-weather">
              <Cloud size={18} strokeWidth={2} />
              <b className="tabular">{Number.isFinite(outTemp) ? `${Math.round(outTemp)}°` : "—"}</b>
            </span>
            <button type="button" className={"home-ic " + (secure ? "ok" : "warn")} onClick={onOpenSecurity} aria-label="Security">
              {secure ? <ShieldCheck size={22} strokeWidth={2} /> : <ShieldAlert size={22} strokeWidth={2} />}
            </button>
            <button type="button" className={"home-ic" + (alertCount ? " warn" : "")} onClick={onOpenSecurity} aria-label="Alerts">
              <Bell size={20} strokeWidth={2} />
              {alertCount > 0 && <span className="home-badge">{alertCount}</span>}
            </button>
            <span className={"home-ic " + (connected ? "ok" : "warn")} aria-label="Connection">
              {connected ? <Wifi size={20} strokeWidth={2} /> : <WifiOff size={20} strokeWidth={2} />}
            </span>
          </div>
        </div>
      </header>

      <nav className="hx-rooms">
        {rooms.map((r) => (
          <button type="button" className="hx-room" key={r.id} onClick={() => navigate(r.path)}>
            <r.Icon size={22} strokeWidth={2} className="hx-room-ic" />
            <div className="hx-room-meta">
              <div className="hx-room-n">{r.name}</div>
              <div className="hx-room-s">{r.stat}</div>
            </div>
          </button>
        ))}
      </nav>

      <div className="lux-grid hx-body">
        <div className="lux-col">
          <SecurityControls onToast={onToast} />
        </div>
        <div className="lux-col">
          <GeyserCard onToast={onToast} />
          <LightingCard config={ENTITIES.lighting.living} onToast={onToast} onOpenLighting={() => navigate("/living-room")} />
        </div>
        <div className="lux-col">
          <SolarCard />
          <LaundryStatus onToast={onToast} />
        </div>
      </div>

      <ScenesBar onToast={onToast} />
    </div>
  );
}
