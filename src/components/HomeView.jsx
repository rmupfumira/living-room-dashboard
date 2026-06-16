import { useEffect, useMemo, useState } from "react";
import { Wifi, WifiOff, Bell, ShieldCheck, ShieldAlert, Lightbulb, Thermometer, Lock, Unlock, Warehouse, ChevronRight } from "lucide-react";
import { ENTITIES, ALERT_SENSORS } from "../entities";
import { useEntity, useHA } from "../ha/HaContext";
import { useService, haAuthUrl } from "../ha/useService";
import { useConfirm } from "./Confirm";
import MediaCard from "./MediaCard";
import ScenesBar from "./ScenesBar";

const greetingFor = (h) => (h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : h < 21 ? "Good evening" : "Good night");
const numv = (ent) => { const v = Number(ent?.state); return Number.isFinite(v) ? v : NaN; };

/**
 * Calm landing screen (the "clean overview"): a time-aware greeting, scenes,
 * a row of colour-coded quick controls, and a camera + now-playing strip.
 * All the depth lives behind the rail tabs.
 */
export default function HomeView({ name = "Mupfumira", onToast, onOpenSecurity, navigate }) {
  const { status, entities } = useHA();
  const confirm = useConfirm();
  const call = useService();
  const [now, setNow] = useState(() => new Date());
  const [tick, setTick] = useState(0);

  useEffect(() => { const id = setInterval(() => setNow(new Date()), 20000); return () => clearInterval(id); }, []);
  useEffect(() => { const id = setInterval(() => setTick((t) => t + 1), 8000); return () => clearInterval(id); }, []);

  /* header */
  const hh = now.getHours();
  const mm = String(now.getMinutes()).padStart(2, "0");
  const HH = String(hh).padStart(2, "0");
  const dateStr = now.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" }).toUpperCase();
  const connected = status === "connected";

  const S = ENTITIES.security;
  const st = (id) => entities[id]?.state;
  const isOpen = (id) => /^(open|opening)$/i.test(st(id) || "");
  const isArmed = (id) => /^armed/i.test(st(id) || "");
  const isLocked = (id) => st(id) === "locked";
  const secure =
    isArmed(S.outdoorAlarm) && !isOpen(S.garage) && !isOpen(S.gate) && !isOpen(S.screenGate) &&
    isLocked(S.entArea) && isLocked(S.frontDoorLock);
  const alertCount = ALERT_SENSORS.filter((a) => entities[a.id]?.state === "on").length;

  /* quick tiles */
  const LIGHTS = "light.living_room_lights_rgb";
  const lightsOn = useEntity(LIGHTS)?.state === "on";
  const acEnt = useEntity(ENTITIES.climate.living.ac);
  const acTemp = numv(useEntity(ENTITIES.climate.living.temp));
  const hvac = acEnt?.state || "off";
  const locked = useEntity(S.frontDoorLock)?.state === "locked";
  const garageOpen = isOpen(S.garage);

  const toggleLight = () => { onToast?.("bulb", `Living lights ${lightsOn ? "off" : "on"}`); call("light", "toggle", {}, { entity_id: LIGHTS }); };
  const toggleLock = async () => {
    if (locked) {
      const ok = await confirm({ title: "Unlock Front Door?", message: "This will unlock the front door and reduce your home security.", confirmLabel: "Unlock", danger: true });
      if (!ok) return;
    }
    onToast?.("lock", `Front door ${locked ? "unlocking" : "locking"}`);
    call("lock", locked ? "unlock" : "lock", {}, { entity_id: S.frontDoorLock });
  };
  const toggleGarage = async () => {
    if (!garageOpen) {
      const ok = await confirm({ title: "Open Garage?", message: "This will open the garage door.", confirmLabel: "Open", danger: true });
      if (!ok) return;
    }
    onToast?.("warehouse", `Garage ${garageOpen ? "closing" : "opening"}`);
    call("cover", garageOpen ? "close_cover" : "open_cover", {}, { entity_id: S.garage });
  };

  /* camera glance */
  const camPath = useEntity(ENTITIES.doorbell.camera)?.attributes?.entity_picture;
  const camSrc = useMemo(() => {
    if (!camPath) return "";
    const u = haAuthUrl(camPath);
    return u + (u.includes("?") ? "&" : "?") + "t=" + tick;
  }, [camPath, tick]);

  return (
    <div className="home">
      <header className="home-head">
        <div>
          <div className="home-greet">{greetingFor(hh)}, {name}</div>
          <div className="home-date">{dateStr} · {HH}:{mm}</div>
        </div>
        <div className="home-status">
          <button type="button" className={"home-ic " + (secure ? "ok" : "warn")} onClick={onOpenSecurity} aria-label="Security">
            {secure ? <ShieldCheck size={24} strokeWidth={2} /> : <ShieldAlert size={24} strokeWidth={2} />}
          </button>
          <button type="button" className={"home-ic" + (alertCount ? " warn" : "")} onClick={onOpenSecurity} aria-label="Alerts">
            <Bell size={22} strokeWidth={2} />
            {alertCount > 0 && <span className="home-badge">{alertCount}</span>}
          </button>
          <span className={"home-ic " + (connected ? "ok" : "warn")} aria-label="Connection">
            {connected ? <Wifi size={22} strokeWidth={2} /> : <WifiOff size={22} strokeWidth={2} />}
          </span>
        </div>
      </header>

      <div className="home-label">Scenes</div>
      <ScenesBar onToast={onToast} />

      <div className="home-tiles">
        <button type="button" className={"ht " + (lightsOn ? "amber" : "off")} onClick={toggleLight}>
          <Lightbulb size={28} strokeWidth={2} className="ht-ic" />
          <div className="ht-n">Living Lights</div>
          <div className="ht-v">{lightsOn ? "On" : "Off"}</div>
        </button>
        <button type="button" className={"ht " + (hvac === "heat" ? "orange" : hvac === "cool" ? "blue" : "off")} onClick={() => navigate("/living-room")}>
          <Thermometer size={28} strokeWidth={2} className="ht-ic" />
          <div className="ht-n">Living Room AC</div>
          <div className="ht-v">{Number.isFinite(acTemp) ? `${Math.round(acTemp)}°` : "—"}</div>
          <div className="ht-s">{hvac === "off" ? "Off" : hvac.replace("_", " ")}</div>
        </button>
        <button type="button" className={"ht " + (locked ? "green" : "red")} onClick={toggleLock}>
          {locked ? <Lock size={28} strokeWidth={2} className="ht-ic" /> : <Unlock size={28} strokeWidth={2} className="ht-ic" />}
          <div className="ht-n">Front Door</div>
          <div className="ht-v">{locked ? "Locked" : "Unlocked"}</div>
        </button>
        <button type="button" className={"ht " + (garageOpen ? "amber" : "green")} onClick={toggleGarage}>
          <Warehouse size={28} strokeWidth={2} className="ht-ic" />
          <div className="ht-n">Garage</div>
          <div className="ht-v">{garageOpen ? "Open" : "Closed"}</div>
        </button>
      </div>

      <div className="home-bottom">
        <button type="button" className="home-cam" onClick={() => navigate("/cameras")} aria-label="Cameras">
          {camSrc ? <img src={camSrc} alt="Front door" onError={(e) => { e.currentTarget.style.opacity = 0; }} /> : <div className="cam-fallback">Front Door</div>}
          <div className="home-cam-ov"><span>Front Door</span><ChevronRight size={18} strokeWidth={2.4} /></div>
        </button>
        <MediaCard onToast={onToast} />
      </div>
    </div>
  );
}
