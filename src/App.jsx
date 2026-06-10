import { useEffect, useMemo, useRef, useState } from "react";
import { ShieldCheck, Sparkles, LayoutGrid, Plus } from "lucide-react";

import {
  rooms,
  devicesByRoom,
  climateByRoom,
  weather,
  inverter,
  music,
  doorbell as doorbellInit,
  scenes,
  security as securityInit,
  deviceIcon,
} from "./data";
import { applyAccent } from "./lib/accent";

import Rail from "./components/Rail";
import Header from "./components/Header";
import SectionLabel from "./components/SectionLabel";
import ClimateCard from "./components/ClimateCard";
import EnergyCard from "./components/EnergyCard";
import WeatherCard from "./components/WeatherCard";
import NowPlaying from "./components/NowPlaying";
import DoorbellCard from "./components/DoorbellCard";
import SceneStrip from "./components/SceneStrip";
import AccessCard from "./components/AccessCard";
import DeviceCard from "./components/DeviceCard";
import Toast from "./components/Toast";
import AccentPicker from "./components/AccentPicker";

const clone = (o) => JSON.parse(JSON.stringify(o));

/* ─── localStorage helpers ──────────────────────────────────────── */
const LS_THEME = "nocturne.theme";
const LS_ACCENT = "nocturne.accent";

function readTheme() {
  const v = localStorage.getItem(LS_THEME);
  return v === "light" ? false : true; // default dark
}
function readAccent() {
  return localStorage.getItem(LS_ACCENT) || "#5fe3b0";
}

/* ─── scene side-effects ────────────────────────────────────────── */
const SCENE_CLIMATE_PATCH = {
  morning: { brightness: 70, mode: "auto" },
  focus: { brightness: 90, mode: "cool", target: 22 },
  movie: { brightness: 15, mode: "cool" },
  dinner: { brightness: 45, mode: "fan" },
  guest: { brightness: 60, mode: "auto" },
  away: { brightness: 0 },
  night: { brightness: 0, target: 19 },
};

export default function App() {
  /* ─── theme + accent ──────────────────────────────────────────── */
  const [dark, setDark] = useState(readTheme);
  const [accent, setAccent] = useState(readAccent);

  // Initial mount — set <html data-theme> + accent vars before paint.
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
    applyAccent(accent, dark);
    // run only once — subsequent flips go through toggleTheme/pickAccent
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Flip the theme without triggering stuck-mid-transition glitches.
   * Per Chromium issue: transitions on theme-derived properties (color, bg,
   * border-color) can latch the *old* value if the underlying var changes
   * during the transition. We kill transitions for two animation frames so
   * the new values paint cleanly, then re-enable them.
   */
  const toggleTheme = () => {
    const next = !dark;
    const root = document.documentElement;
    root.classList.add("theme-anim-off");
    root.setAttribute("data-theme", next ? "dark" : "light");
    applyAccent(accent, next);
    setDark(next);
    localStorage.setItem(LS_THEME, next ? "dark" : "light");
    requestAnimationFrame(() =>
      requestAnimationFrame(() => root.classList.remove("theme-anim-off"))
    );
  };

  const pickAccent = (hex) => {
    const root = document.documentElement;
    root.classList.add("theme-anim-off");
    setAccent(hex);
    applyAccent(hex, dark);
    localStorage.setItem(LS_ACCENT, hex);
    requestAnimationFrame(() =>
      requestAnimationFrame(() => root.classList.remove("theme-anim-off"))
    );
  };

  /* ─── routing-ish state ───────────────────────────────────────── */
  const [view, setView] = useState("dashboard");
  const [room, setRoom] = useState("living");
  const [query, setQuery] = useState("");

  /* ─── entity-ish state ────────────────────────────────────────── */
  const [devices, setDevices] = useState(() => clone(devicesByRoom));
  const [climate, setClimate] = useState(() => clone(climateByRoom));
  const [security, setSecurity] = useState(() => ({ ...securityInit }));
  const [doorbell, setDoorbell] = useState(doorbellInit);
  const [activeScene, setActiveScene] = useState(null);

  /* ─── music ───────────────────────────────────────────────────── */
  const [musicState, setMusicState] = useState({ idx: 0, playing: true, progress: 48 });
  const patchMusic = (patch) => setMusicState((s) => ({ ...s, ...patch }));

  /* ─── toast ───────────────────────────────────────────────────── */
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);
  const fireToast = (icon, msg) => {
    setToast({ icon, msg });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2400);
  };

  /* ─── derived ─────────────────────────────────────────────────── */
  const roomName = rooms.find((r) => r.id === room)?.name ?? "—";
  const cl = climate[room];
  const q = query.trim().toLowerCase();
  const visibleDevices = useMemo(
    () =>
      (devices[room] ?? []).filter(
        (d) => !q || d.name.toLowerCase().includes(q) || d.model.toLowerCase().includes(q)
      ),
    [devices, room, q]
  );

  /* ─── action handlers ─────────────────────────────────────────── */
  const toggleDevice = (rid, did) => {
    setDevices((prev) => {
      const next = clone(prev);
      const dev = next[rid].find((d) => d.id === did);
      dev.on = !dev.on;
      fireToast(dev.on ? "power" : "power-off", `${dev.name} ${dev.on ? "on" : "off"}`);
      return next;
    });
  };

  const patchClimate = (patch) =>
    setClimate((prev) => ({ ...prev, [room]: { ...prev[room], ...patch } }));

  const toggleSec = (key, onMsg, offMsg, icon) => {
    setSecurity((s) => {
      const v = !s[key];
      fireToast(icon, v ? onMsg : offMsg);
      return { ...s, [key]: v };
    });
  };

  const runScene = (s) => {
    setActiveScene(s.id);
    const patch = SCENE_CLIMATE_PATCH[s.id];
    if (patch) patchClimate(patch);
    if (s.id === "away" || s.id === "night") {
      setSecurity((sec) => ({ ...sec, outdoorAlarm: true, indoorAlarm: true }));
    }
    if (s.id === "guest") setSecurity((sec) => ({ ...sec, indoorAlarm: false }));
    fireToast("sparkles", `${s.name} scene activated`);
  };

  const railPick = (id, label) => {
    if (id === "dashboard") {
      setView(id);
    } else {
      // Cameras / Scenes / Power are out of scope — fire a friendly toast.
      fireToast(
        id === "cameras" ? "cctv" : id === "scenes" ? "sparkles" : "zap",
        `${label} view — coming soon`
      );
    }
  };

  /* ─── render ──────────────────────────────────────────────────── */
  return (
    <div className="app">
      <Rail view={view} onPick={railPick} />

      <div className="main">
        <Header
          roomName={roomName}
          query={query}
          onQuery={setQuery}
          dark={dark}
          onToggleTheme={toggleTheme}
        />

        <div className="board">
          <div className="grid">
            {/* Row 1 */}
            <ClimateCard
              roomName={roomName}
              climate={cl}
              onPatch={patchClimate}
              onToast={fireToast}
            />
            <EnergyCard inverter={inverter} />
            <WeatherCard weather={weather} />

            {/* Row 2 */}
            <NowPlaying
              music={music}
              state={musicState}
              onSet={patchMusic}
              onNext={() =>
                setMusicState((s) => ({
                  ...s,
                  idx: (s.idx + 1) % music.queue.length,
                  progress: 0,
                }))
              }
              onPrev={() =>
                setMusicState((s) => ({
                  ...s,
                  idx: (s.idx - 1 + music.queue.length) % music.queue.length,
                  progress: 0,
                }))
              }
              onTogglePlay={() => setMusicState((s) => ({ ...s, playing: !s.playing }))}
            />
            <DoorbellCard
              doorbell={doorbell}
              ringing={doorbell.ringing}
              onUnlock={() => {
                setDoorbell((d) => ({ ...d, ringing: false }));
                fireToast("lock-open", "Front door unlocked");
              }}
              onTalk={() => {
                setDoorbell((d) => ({ ...d, ringing: false }));
                fireToast("mic", "Two-way audio connected");
              }}
              onDismiss={() => {
                setDoorbell((d) => ({ ...d, ringing: false }));
                fireToast("bell-off", "Doorbell dismissed");
              }}
            />

            {/* Scenes */}
            <SectionLabel>Scenes</SectionLabel>
            <SceneStrip scenes={scenes} active={activeScene} onRun={runScene} />

            {/* Security & Access */}
            <SectionLabel>Security &amp; Access</SectionLabel>
            <AccessCard
              icon="warehouse"
              name="Garage Door"
              on={security.garage}
              onLabel="Open"
              offLabel="Closed"
              tone="var(--c-solar)"
              onToggle={() => toggleSec("garage", "Garage opening", "Garage closing", "warehouse")}
            />
            <AccessCard
              icon="fence"
              name="Front Gate"
              on={security.gate}
              onLabel="Open"
              offLabel="Closed"
              tone="var(--c-solar)"
              onToggle={() => toggleSec("gate", "Gate opening", "Gate closing", "fence")}
            />
            <AccessCard
              icon="siren"
              name="Outdoor Alarm"
              on={security.outdoorAlarm}
              onLabel="Armed"
              offLabel="Disarmed"
              tone="var(--alert)"
              onToggle={() =>
                toggleSec("outdoorAlarm", "Outdoor alarm armed", "Outdoor alarm disarmed", "siren")
              }
            />
            <AccessCard
              icon="shield"
              name="Indoor Alarm"
              on={security.indoorAlarm}
              onLabel="Armed"
              offLabel="Disarmed"
              tone="var(--alert)"
              onToggle={() =>
                toggleSec("indoorAlarm", "Indoor alarm armed", "Indoor alarm disarmed", "shield")
              }
            />

            {/* Devices */}
            <SectionLabel
              right={
                <div className="tabs">
                  {rooms.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      className={"tab" + (room === r.id ? " on" : "")}
                      onClick={() => setRoom(r.id)}
                    >
                      {r.name}
                    </button>
                  ))}
                  <button
                    type="button"
                    className="tab-add"
                    onClick={() => fireToast("plus", "Pair a new room in Home Assistant")}
                    aria-label="Add room"
                  >
                    <Plus size={14} strokeWidth={2.4} />
                  </button>
                </div>
              }
            >
              {roomName} // Devices
            </SectionLabel>

            {visibleDevices.map((d) => (
              <DeviceCard
                key={d.id}
                dev={d}
                icon={deviceIcon[d.type] ?? "plug"}
                onToggle={() => toggleDevice(room, d.id)}
              />
            ))}
            {visibleDevices.length === 0 && (
              <div className="empty">No devices match “{query}”.</div>
            )}
          </div>
        </div>
      </div>

      <Toast toast={toast} />
      <AccentPicker accent={accent} onPick={pickAccent} />
    </div>
  );
}
