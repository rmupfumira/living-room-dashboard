import { useEffect, useState } from "react";
import {
  ShieldCheck, ShieldAlert, Shield, Siren, Fence, Warehouse, DoorClosed, Lock, DoorOpen,
  Cloud, Sofa, ChefHat, BedDouble, Video, Sun, House, BatteryCharging, Battery, UtilityPole,
  Lightbulb, Sunrise, Moon, Clapperboard, Flame, Droplet, Thermometer, WashingMachine, Wind,
  Power, Check, AlertTriangle, Bell,
} from "lucide-react";
import { ENTITIES, ALERT_SENSORS } from "../entities";
import { useHA } from "../ha/HaContext";
import { useService } from "../ha/useService";
import { useConfirm } from "./Confirm";
import { useLaundry } from "../ha/useLaundry";

const greetingFor = (h) => (h < 12 ? "Good Morning" : h < 17 ? "Good Afternoon" : h < 21 ? "Good Evening" : "Good Night");
const numv = (ent) => { const v = Number(ent?.state); return Number.isFinite(v) ? v : NaN; };
const f1 = (n) => (Math.round(Math.abs(n) * 10) / 10).toFixed(1);
function toKw(ent) {
  if (!ent) return 0;
  const v = Number(ent.state); if (!Number.isFinite(v)) return 0;
  return (ent.attributes?.unit_of_measurement || "").toLowerCase() === "w" ? v / 1000 : v;
}

const SEC_ICON = { siren: Siren, shield: Shield, fence: Fence, warehouse: Warehouse, "door-closed": DoorClosed, lock: Lock };
const UNSECURE_VERB = { alarm: "Disarm", cover: "Open", lock: "Unlock", gate: "Open" };

function secStatus(kind, state) {
  const unavail = !state || state === "unavailable";
  if (kind === "alarm") return { secure: /^armed/i.test(state || ""), unavail, label: /^armed/i.test(state || "") ? "Armed" : "Disarmed" };
  if (kind === "cover") { const open = /^(open|opening)$/i.test(state || ""); return { secure: !open, unavail, label: open ? "Open" : "Closed" }; }
  if (kind === "gate") { const closed = (state || "").toLowerCase() === "closed"; return { secure: closed, unavail, label: state || "—" }; }
  return { secure: state === "locked", unavail, label: state === "locked" ? "Locked" : "Unlocked" };
}

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

  const secAction = (ctl, isSecure) => {
    if (ctl.kind === "alarm") call("alarm_control_panel", isSecure ? "alarm_disarm" : "alarm_arm_away", {}, { entity_id: ctl.entity });
    else if (ctl.kind === "cover" || ctl.kind === "gate") call("cover", isSecure ? "open_cover" : "close_cover", {}, { entity_id: ctl.entity });
    else call("lock", isSecure ? "unlock" : "lock", {}, { entity_id: ctl.entity });
  };
  const secToggle = async (ctl) => {
    const s = secStatus(ctl.kind, st(ctl.statusEntity || ctl.entity));
    if (s.unavail) return;
    if (s.secure) {
      const verb = UNSECURE_VERB[ctl.kind] || "Change";
      const ok = await confirm({ title: `${verb} ${ctl.name}?`, message: `This will ${verb.toLowerCase()} ${ctl.name.toLowerCase()} and reduce your home security.`, confirmLabel: verb, danger: true });
      if (!ok) return;
    }
    onToast?.("shield", `${ctl.name} ${s.secure ? "opening" : "securing"}`);
    secAction(ctl, s.secure);
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

  /* energy */
  const pvKw = toKw(entities[ENTITIES.power.pvPower]);
  const loadKw = toKw(entities[ENTITIES.power.loadPower]);
  const gridKw = toKw(entities[ENTITIES.power.gridPower]);
  const battKw = toKw(entities[ENTITIES.power.batteryPower]);
  const soc = numv(entities[ENTITIES.power.batterySoc]);
  const charging = battKw > 0.05;
  const pvToday = numv(entities[ENTITIES.power.pvToday]);
  const loadToday = numv(entities[ENTITIES.power.loadToday]);
  const gridState = Math.abs(gridKw) < 0.05 ? "Grid idle" : gridKw > 0 ? "Importing" : "Exporting";

  /* lighting */
  const RGB = "light.living_room_lights_rgb";
  const rgbEnt = entities[RGB];
  const lightsOn = rgbEnt?.state === "on";
  const bri = Math.round(((rgbEnt?.attributes?.brightness || 0) / 255) * 100);
  const toggleLights = () => { onToast?.("bulb", `Living lights ${lightsOn ? "off" : "on"}`); call("light", "toggle", {}, { entity_id: RGB }); };
  const preset = (pct) => {
    if (pct === 0) { call("light", "turn_off", {}, { entity_id: RGB }); onToast?.("bulb", "Living lights off"); }
    else { call("light", "turn_on", { brightness_pct: pct }, { entity_id: RGB }); onToast?.("bulb", `Living lights ${pct}%`); }
  };

  /* geyser */
  const G = ENTITIES.geyser;
  const geyserOn = st(G.toggle) === "on";
  const geyserTemp = numv(entities[G.currentTemp]);
  const geyserTarget = numv(entities[G.targetTemp]);
  const geyserW = numv(entities[G.power]);
  const heating = geyserOn && Number.isFinite(geyserW) && geyserW > 50;

  /* quick actions */
  const scene = (id) => { const s = ENTITIES.scenes.find((x) => x.id === id); if (s) { onToast?.("sparkles", `${s.name}`); call("input_boolean", s.momentary ? "turn_on" : "toggle", {}, { entity_id: s.entity }); } };
  const garageOpen = /^(open|opening)$/i.test(st(ENTITIES.security.garage) || "");
  const quick = [
    { id: "morning", name: "Good Morning", Icon: Sunrise, tone: "amber", on: () => scene("morning") },
    { id: "night", name: "Good Night", Icon: Moon, tone: "violet", on: () => scene("night") },
    { id: "movie", name: "Movie", Icon: Clapperboard, tone: "violet", on: () => scene("movie") },
    { id: "garage", name: garageOpen ? "Close Garage" : "Garage", Icon: Warehouse, tone: "green", on: async () => { if (!garageOpen) { const ok = await confirm({ title: "Open Garage?", confirmLabel: "Open", danger: true }); if (!ok) return; } onToast?.("warehouse", `Garage ${garageOpen ? "closing" : "opening"}`); call("cover", garageOpen ? "close_cover" : "open_cover", {}, { entity_id: ENTITIES.security.garage }); } },
    { id: "gate", name: "Open Gate", Icon: Fence, tone: "blue", on: openGate },
    { id: "geyser", name: "Geyser Boost", Icon: Flame, tone: "blue", on: () => { onToast?.(geyserOn ? "power-off" : "power", `Geyser ${geyserOn ? "off" : "on"}`); call(G.toggle.split(".")[0], "toggle", {}, { entity_id: G.toggle }); } },
  ];

  /* weather + rooms */
  const outTemp = Number(entities[ENTITIES.weather]?.attributes?.temperature);
  const livingTemp = numv(entities[ENTITIES.climate.living.temp]);
  const tinoTemp = numv(entities[ENTITIES.tinotenda.temp]);
  const rooms = [
    { name: "Living Room", temp: livingTemp, path: "/living-room", amb: "radial-gradient(90% 90% at 65% 25%,rgba(244,180,76,.28),transparent 60%),linear-gradient(160deg,#2a2118,#14110d)" },
    { name: "Kitchen", temp: NaN, sub: "Ambience", path: "/kitchen", amb: "radial-gradient(90% 90% at 60% 30%,rgba(200,210,220,.14),transparent 60%),linear-gradient(160deg,#1b2026,#101317)" },
    { name: "Tinotenda", temp: tinoTemp, path: "/tinotenda", amb: "radial-gradient(90% 90% at 60% 30%,rgba(169,139,247,.2),transparent 60%),linear-gradient(160deg,#1c1a2a,#111016)" },
    { name: "Cameras", temp: NaN, sub: "8 feeds", path: "/cameras", amb: "radial-gradient(90% 90% at 55% 25%,rgba(91,157,249,.16),transparent 60%),linear-gradient(160deg,#141c26,#0c1013)" },
  ];

  /* laundry (first machine worth showing) + notifications */
  const lMachine = laundry.machines.find((m) => m.running) || laundry.machines.find((m) => m.done);
  const lOff = laundry.machines.find((m) => m.powerOff);
  const switchOn = (m) => { call(m.plug.split(".")[0], "turn_on", {}, { entity_id: m.plug }); onToast?.("power", `${m.name} power on`); };
  const activeAlert = ALERT_SENSORS.filter((a) => st(a.id) === "on").sort((a, b) => ({ critical: 0, warning: 1, info: 2 }[a.class] - { critical: 0, warning: 1, info: 2 }[b.class]))[0];

  return (
    <div className="o10">
      <header className="ohdr">
        <div>
          <div className="odate">{dateStr}</div>
          <div className="ogreet">{greetingFor(hh)}</div>
          <button type="button" className={"overdict " + (secure ? "ok" : "warn")} onClick={onOpenSecurity}>
            <span className="sh">{secure ? <ShieldCheck size={19} /> : <ShieldAlert size={19} />}</span>
            <div>
              <div className="vt">{secure ? "Home Secure" : `${openItems.length} Open`}</div>
              <div className="vs">{secure ? "All systems normal" : openItems.map((c) => c.name).join(", ")}</div>
            </div>
          </button>
        </div>
        <div className="ohead-r">
          <div className="owx"><Cloud size={20} /><b className="num">{Number.isFinite(outTemp) ? `${Math.round(outTemp)}°` : "—"}</b></div>
          <div className="oclock num">{HH}:{mm}</div>
        </div>
      </header>

      <nav className="orooms">
        {rooms.map((r) => (
          <button type="button" className="oroom" key={r.name} onClick={() => navigate(r.path)}>
            <span className="amb" style={{ background: r.amb }} />
            <span className="in">
              <span className="rn">{r.name}</span>
              <span className="rt num">{Number.isFinite(r.temp) ? `${Math.round(r.temp)}°` : (r.sub || "")}</span>
            </span>
          </button>
        ))}
      </nav>

      <section className="grid-primary">
        {/* Security */}
        <div className="ocard">
          <div className="ocardhead">
            <div className="octitle">Security</div>
            <div className={"overd " + (secure ? "ok" : "warn")}>
              {secure ? <><ShieldCheck size={13} /> All Secure</> : <><AlertTriangle size={13} /> {openItems.length} open</>}
            </div>
          </div>
          <div className="sectiles">
            {controls.map((c) => {
              const s = secStatus(c.kind, st(c.statusEntity || c.entity));
              const alert = !s.secure && !s.unavail && !c.ignore;
              const cls = s.unavail ? "mut" : alert ? "warn" : s.secure ? "ok" : "mut";
              const Icon = SEC_ICON[c.icon] || Shield;
              return (
                <button type="button" className={"stile " + cls} key={c.id} onClick={() => secToggle(c)}>
                  <span className="si"><Icon size={17} /></span>
                  <div><div className="sn">{c.name}</div><div className="sv">{s.unavail ? "—" : s.label}</div></div>
                </button>
              );
            })}
          </div>
          <div className="secbtns">
            <button type="button" className="secbtn" onClick={openFrontDoor}><DoorOpen size={16} /> Open Front Door</button>
            <button type="button" className="secbtn ghost" onClick={openGate}><Fence size={16} /> Open Gate</button>
          </div>
        </div>

        {/* Energy */}
        <div className="ocard">
          <div className="octitle">Energy</div>
          <div className="oflow">
            <div className="oflow-row oe-solar">
              <span className="ring"><Sun size={18} /></span>
              <div className="oflow-meta"><div className="oflow-v num">{f1(pvKw)}<small>kW</small></div><div className="oflow-l">Solar · {pvKw > 0.05 ? "Producing" : "Idle"}</div></div>
            </div>
            <div className="oflow-row oe-batt">
              <span className="ring">{charging ? <BatteryCharging size={18} /> : <Battery size={18} />}</span>
              <div className="oflow-meta"><div className="oflow-v num">{Number.isFinite(soc) ? Math.round(soc) : "—"}<small>%</small></div><div className="oflow-l">Battery · {charging ? "Charging" : battKw < -0.05 ? "Discharging" : "Idle"}</div></div>
            </div>
            <div className="oflow-row oe-home">
              <span className="ring"><House size={18} /></span>
              <div className="oflow-meta"><div className="oflow-v num">{f1(loadKw)}<small>kW</small></div><div className="oflow-l">Home · Using</div></div>
            </div>
            <div className="oflow-row oe-grid">
              <span className="ring"><UtilityPole size={18} /></span>
              <div className="oflow-meta"><div className="oflow-v num">{f1(gridKw)}<small>kW</small></div><div className="oflow-l">{gridState}</div></div>
            </div>
          </div>
          <div className="oestats">
            <div className="oestat"><div className="el">Produced</div><div className="ev num">{Number.isFinite(pvToday) ? f1(pvToday) : "—"}<small>kWh</small></div></div>
            <div className="oestat"><div className="el">Used</div><div className="ev num">{Number.isFinite(loadToday) ? f1(loadToday) : "—"}<small>kWh</small></div></div>
            <div className="oestat"><div className="el">Battery</div><div className="ev num">{Number.isFinite(soc) ? Math.round(soc) : "—"}<small>%</small></div></div>
          </div>
        </div>
      </section>

      <section className="grid-controls">
        {/* Lighting */}
        <div className="ocard">
          <div className="octitle">Living Room Lighting</div>
          <div className="litrow">
            <span className="li"><Lightbulb size={19} /></span>
            <div className="lt"><div className="ln">Living Room Lights</div><div className="ls">{lightsOn ? `On · ${bri || 0}%` : "Off"}</div></div>
            <button type="button" className={"otgl" + (lightsOn ? "" : " off")} onClick={toggleLights} aria-label="Living lights" />
          </div>
          <div className="obri">
            <Sun size={16} />
            <div className="obri-track"><span style={{ width: (lightsOn ? bri : 0) + "%" }} /></div>
            <span className="obri-val num">{lightsOn ? bri : 0}%</span>
          </div>
          <div className="litpresets">
            <button type="button" className={"lpreset" + (lightsOn && bri >= 85 ? " on" : "")} onClick={() => preset(100)}>Bright</button>
            <button type="button" className={"lpreset" + (lightsOn && bri >= 30 && bri < 85 ? " on" : "")} onClick={() => preset(50)}>Warm</button>
            <button type="button" className={"lpreset" + (lightsOn && bri < 30 ? " on" : "")} onClick={() => preset(12)}>Movie</button>
            <button type="button" className={"lpreset" + (!lightsOn ? " on" : "")} onClick={() => preset(0)}>Off</button>
          </div>
        </div>

        {/* Quick actions */}
        <div className="ocard">
          <div className="octitle">Quick Actions</div>
          <div className="qa">
            {quick.map((q) => (
              <button type="button" className={"qtile " + q.tone} key={q.id} onClick={q.on}>
                <q.Icon size={22} /><span>{q.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Geyser */}
        <button type="button" className="ocard geyser-card" onClick={() => navigate("/geyser")}>
          <div className="ocardhead">
            <div className="octitle">Geyser</div>
            <div className={"overd " + (heating ? "warn" : geyserOn ? "info" : "")}>{heating ? "Heating" : geyserOn ? "On · Idle" : "Off"}</div>
          </div>
          <div className="gcur">
            <Droplet size={30} />
            <div className="gtemp num">{Number.isFinite(geyserTemp) ? Math.round(geyserTemp) : "—"}<small>°C</small></div>
          </div>
          <div className="gmeta">Water temperature{Number.isFinite(geyserW) ? ` · ${heating ? "heating" : "idle"} at ${Math.round(geyserW)} W` : ""}</div>
          <div className="gfoot"><span className="gtarget num">Target {Number.isFinite(geyserTarget) ? Math.round(geyserTarget) : "—"}°</span><span>Tap for controls →</span></div>
        </button>
      </section>

      <section className="obottom">
        {/* Climate */}
        <div className="ocard">
          <div className="octitle">Climate</div>
          <div className="clm">
            <div className="cstat"><Thermometer size={19} /><div><div className="cv num">{Number.isFinite(livingTemp) ? Math.round(livingTemp) : "—"}<small>°</small></div><div className="cl">Living</div></div></div>
            <div className="cstat"><Cloud size={19} /><div><div className="cv num">{Number.isFinite(outTemp) ? Math.round(outTemp) : "—"}<small>°</small></div><div className="cl">Outside</div></div></div>
          </div>
        </div>

        {/* Laundry */}
        <div className={"ocard lcard" + (lMachine?.done ? " done" : "")}>
          <div className="octitle">Laundry</div>
          {lMachine ? (
            <>
              <div className="lrun">
                <span className="lri">{lMachine.done ? <Check size={20} /> : lMachine.id === "washer" ? <WashingMachine size={20} /> : <Wind size={20} />}</span>
                <div className="lrt">
                  <div className="lrn">{lMachine.name}<span className={"lrbadge" + (lMachine.done ? " done" : "")}>{lMachine.running && <span className="live" style={{ marginRight: ".35em" }} />}{lMachine.label}</span></div>
                  <div className="lrs">{lMachine.sub}</div>
                </div>
              </div>
              {lMachine.running && lMachine.progress != null && <div className="lprog"><span style={{ width: lMachine.progress + "%" }} /></div>}
            </>
          ) : (
            <div className="oemptied">No cycle running</div>
          )}
          {lOff && <button type="button" className="lwarn" onClick={() => switchOn(lOff)}><Power size={14} /> {lOff.name} power is <b>&nbsp;off&nbsp;</b> · tap to switch on</button>}
        </div>

        {/* Notifications */}
        <div className="ocard">
          <div className="octitle">Notifications</div>
          {activeAlert ? (
            <div className="lrun" style={{ margin: 0 }}>
              <span className="lri" style={{ background: "rgba(242,97,119,.2)", color: "var(--red)" }}><AlertTriangle size={18} /></span>
              <div className="lrt"><div className="lrn">{activeAlert.label}</div><div className="lrs">{activeAlert.class} alert · tap Security</div></div>
            </div>
          ) : (
            <div className="lrun" style={{ margin: 0 }}>
              <span className="lri" style={{ background: "rgba(63,217,139,.14)", color: "var(--green)" }}><Bell size={18} /></span>
              <div className="lrt"><div className="lrn">All clear</div><div className="lrs">No active alerts</div></div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
