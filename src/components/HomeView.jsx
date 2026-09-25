import { useEffect, useState } from "react";
import {
  ShieldCheck, Shield, Siren, Fence, Warehouse, DoorClosed, Lock, Unlock, DoorOpen,
  Cloud, Sunrise, Moon, Clapperboard, Lightbulb, Droplet, House, WashingMachine, Wind,
  Check, AlertTriangle,
} from "lucide-react";
import { ENTITIES } from "../entities";
import { useHA } from "../ha/HaContext";
import { useService } from "../ha/useService";
import { useConfirm } from "./Confirm";
import { useLaundry } from "../ha/useLaundry";

const greetingFor = (h) => (h < 12 ? "Good Morning" : h < 17 ? "Good Afternoon" : h < 21 ? "Good Evening" : "Good Night");
const numv = (ent) => { const v = Number(ent?.state); return Number.isFinite(v) ? v : NaN; };
const f1 = (n) => (Math.round(Math.abs(n) * 10) / 10).toFixed(1);
function toKw(ent) { if (!ent) return 0; const v = Number(ent.state); if (!Number.isFinite(v)) return 0; return (ent.attributes?.unit_of_measurement || "").toLowerCase() === "w" ? v / 1000 : v; }

const SEC_ICON = { siren: Siren, shield: Shield, fence: Fence, warehouse: Warehouse, "door-closed": DoorClosed, lock: Lock };
const UNSECURE_VERB = { alarm: "Disarm", cover: "Open", lock: "Unlock", gate: "Open" };

function secStatus(kind, state) {
  const unavail = !state || state === "unavailable";
  if (kind === "alarm") return { secure: /^armed/i.test(state || ""), unavail, label: /^armed/i.test(state || "") ? "Armed" : "Disarmed" };
  if (kind === "cover") { const open = /^(open|opening)$/i.test(state || ""); return { secure: !open, unavail, label: open ? "Open" : "Closed" }; }
  if (kind === "gate") { const closed = (state || "").toLowerCase() === "closed"; return { secure: closed, unavail, label: state || "—" }; }
  return { secure: state === "locked", unavail, label: state === "locked" ? "Locked" : "Unlocked" };
}

/**
 * Home — deliberately simple and action-first: a compact header, the Security
 * controls up top, and big centered buttons for the things people actually use
 * every day (Good Morning / Good Night + a few regulars). A slim glance strip
 * keeps geyser / energy / laundry one tap away. Everything else lives in the rail.
 */
export default function HomeView({ onToast, onOpenSecurity, navigate }) {
  const { entities } = useHA();
  const call = useService();
  const confirm = useConfirm();
  const laundry = useLaundry();
  const [now, setNow] = useState(() => new Date());
  useEffect(() => { const id = setInterval(() => setNow(new Date()), 20000); return () => clearInterval(id); }, []);

  const hh = now.getHours();
  const HH = String(hh).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  const dateStr = now.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" }).toUpperCase();
  const st = (id) => entities[id]?.state;

  /* security */
  const controls = ENTITIES.securityControls;
  const openItems = controls.filter((c) => !c.ignore).filter((c) => {
    const s = secStatus(c.kind, st(c.statusEntity || c.entity)); return !s.secure && !s.unavail;
  });
  const secure = openItems.length === 0;

  const secToggle = async (ctl) => {
    const s = secStatus(ctl.kind, st(ctl.statusEntity || ctl.entity));
    if (s.unavail) return;
    if (s.secure) {
      const verb = UNSECURE_VERB[ctl.kind] || "Change";
      const ok = await confirm({ title: `${verb} ${ctl.name}?`, message: `This will ${verb.toLowerCase()} ${ctl.name.toLowerCase()} and reduce your home security.`, confirmLabel: verb, danger: true });
      if (!ok) return;
    }
    onToast?.("shield", `${ctl.name} ${s.secure ? "opening" : "securing"}`);
    if (ctl.kind === "alarm") call("alarm_control_panel", s.secure ? "alarm_disarm" : "alarm_arm_away", {}, { entity_id: ctl.entity });
    else if (ctl.kind === "cover" || ctl.kind === "gate") call("cover", s.secure ? "open_cover" : "close_cover", {}, { entity_id: ctl.entity });
    else call("lock", s.secure ? "unlock" : "lock", {}, { entity_id: ctl.entity });
  };
  const fire = (entity) => { const d = entity.split(".")[0]; call(d, d === "automation" ? "trigger" : "turn_on", {}, { entity_id: entity }); };
  const openFrontDoor = async () => {
    const ok = await confirm({ title: "Open the front door?", message: "Disarms the outdoor alarm, unlocks the front door, and opens the screen gate.", confirmLabel: "Open", danger: true });
    if (ok) { onToast?.("door-open", "Opening front door…"); fire(ENTITIES.entryScript); }
  };
  const openGate = async () => {
    const ok = await confirm({ title: "Open the gate?", message: "Disarms the outdoor alarm and opens the gate.", confirmLabel: "Open", danger: true });
    if (ok) { onToast?.("door-open", "Opening gate…"); fire(ENTITIES.gateScript); }
  };

  /* actions — every one confirms first */
  const scene = (id) => { const s = ENTITIES.scenes.find((x) => x.id === id); if (s) { onToast?.("sparkles", `${s.name}`); call("input_boolean", s.momentary ? "turn_on" : "toggle", {}, { entity_id: s.entity }); } };
  const RGB = "light.living_room_lights_rgb";
  const lightsOn = st(RGB) === "on";
  const garageOpen = /^(open|opening)$/i.test(st(ENTITIES.security.garage) || "");
  const MASTER_LOCK = "lock.master_bedroom_2";
  const masterLocked = st(MASTER_LOCK) === "locked";

  const heroActions = [
    { id: "morning", name: "Good Morning", Icon: Sunrise, tone: "amber", run: () => scene("morning") },
    { id: "night", name: "Good Night", Icon: Moon, tone: "violet", run: () => scene("night") },
  ];
  const moreActions = [
    { id: "movie", name: "Movie", Icon: Clapperboard, tone: "violet", run: () => scene("movie") },
    { id: "lights", name: lightsOn ? "Lights Off" : "Living Lights", Icon: Lightbulb, tone: "amber", run: () => { onToast?.("bulb", `Living lights ${lightsOn ? "off" : "on"}`); call("light", "toggle", {}, { entity_id: RGB }); } },
    { id: "garage", name: garageOpen ? "Close Garage" : "Open Garage", Icon: Warehouse, tone: "green", run: () => { onToast?.("warehouse", `Garage ${garageOpen ? "closing" : "opening"}`); call("cover", garageOpen ? "close_cover" : "open_cover", {}, { entity_id: ENTITIES.security.garage }); } },
    { id: "masterbed", name: masterLocked ? "Unlock Master" : "Lock Master", Icon: masterLocked ? Lock : Unlock, tone: "blue", run: () => { onToast?.("lock", `Master bedroom ${masterLocked ? "unlocking" : "locking"}`); call("lock", masterLocked ? "unlock" : "lock", {}, { entity_id: MASTER_LOCK }); } },
  ];
  const runAction = async (a) => {
    const ok = await confirm({ title: `${a.name}?`, message: `Confirm: ${a.name}.`, confirmLabel: "Yes, do it", cancelLabel: "Cancel" });
    if (ok) a.run();
  };

  /* glance strip */
  const outTemp = Number(entities[ENTITIES.weather]?.attributes?.temperature);
  const geyserTemp = numv(entities[ENTITIES.geyser.currentTemp]);
  const loadKw = toKw(entities[ENTITIES.power.loadPower]);
  const soc = numv(entities[ENTITIES.power.batterySoc]);
  const lMachine = laundry.machines.find((m) => m.running) || laundry.machines.find((m) => m.done);

  return (
    <div className="o10 o10-home2">
      <header className="ohdr">
        <div>
          <div className="odate">{dateStr}</div>
          <div className="ogreet">{greetingFor(hh)}</div>
        </div>
        <div className="ohead-r">
          <div className="owx"><Cloud size={22} /><b className="num">{Number.isFinite(outTemp) ? `${Math.round(outTemp)}°` : "—"}</b></div>
          <div className="oclock num">{HH}:{mm}</div>
        </div>
      </header>

      {/* SECURITY — top */}
      <div className="ocard osec">
        <div className="ocardhead">
          <div className="octitle">Security</div>
          <button type="button" className={"overd asbtn " + (secure ? "ok" : "warn")} onClick={onOpenSecurity}>
            {secure ? <><ShieldCheck size={16} /> All Secure</> : <><AlertTriangle size={16} /> {openItems.length} open</>}
          </button>
        </div>
        <div className="sectiles">
          {controls.map((c) => {
            const s = secStatus(c.kind, st(c.statusEntity || c.entity));
            const alert = !s.secure && !s.unavail && !c.ignore;
            const cls = s.unavail ? "mut" : alert ? "warn" : s.secure ? "ok" : "mut";
            const Icon = SEC_ICON[c.icon] || Shield;
            return (
              <button type="button" className={"stile " + cls} key={c.id} onClick={() => secToggle(c)}>
                <span className="si"><Icon size={18} /></span>
                <div><div className="sn">{c.name}</div><div className="sv">{s.unavail ? "—" : s.label}</div></div>
              </button>
            );
          })}
        </div>
        <div className="secbtns">
          <button type="button" className="secbtn" onClick={openFrontDoor}><DoorOpen size={18} /> Open Front Door</button>
          <button type="button" className="secbtn ghost" onClick={openGate}><Fence size={18} /> Open Gate</button>
        </div>
      </div>

      {/* BIG ACTIONS — center */}
      <div className="obig">
        <div className="obig-hero">
          {heroActions.map((a) => (
            <button type="button" className={"obtn hero " + a.tone} key={a.id} onClick={() => runAction(a)}>
              <a.Icon size={46} /><span>{a.name}</span>
            </button>
          ))}
        </div>
        <div className="obig-row">
          {moreActions.map((a) => (
            <button type="button" className={"obtn " + a.tone} key={a.id} onClick={() => runAction(a)}>
              <a.Icon size={30} /><span>{a.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* glance strip */}
      <div className="oglance">
        <button type="button" className="ochip" onClick={() => navigate("/geyser")}>
          <Droplet size={22} /><span className="num">{Number.isFinite(geyserTemp) ? Math.round(geyserTemp) : "—"}°</span><small>Geyser</small>
        </button>
        <button type="button" className="ochip" onClick={() => navigate("/power")}>
          <House size={22} /><span className="num">{f1(loadKw)} kW</span><small>Home · {Number.isFinite(soc) ? Math.round(soc) : "—"}% batt</small>
        </button>
        {lMachine ? (
          <button type="button" className="ochip" onClick={() => navigate("/devices")}>
            {lMachine.done ? <Check size={22} /> : lMachine.id === "washer" ? <WashingMachine size={22} /> : <Wind size={22} />}
            <span>{lMachine.name}</span><small>{lMachine.done ? "Done · unload" : lMachine.running ? (lMachine.remainingMin != null ? `${lMachine.remainingMin} min left` : "Running") : ""}</small>
          </button>
        ) : (
          <button type="button" className="ochip" onClick={() => navigate("/devices")}>
            <WashingMachine size={22} /><span>Laundry</span><small>Idle</small>
          </button>
        )}
      </div>
    </div>
  );
}
