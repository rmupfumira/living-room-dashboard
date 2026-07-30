import { ENTITIES } from "../entities";
import { useHA } from "./HaContext";

/**
 * Derive per-machine laundry state for the Home card + Devices page.
 *
 * Washer: driven by the LG connected-appliance status (`sensor.washer_current_status`)
 * — live and granular (washing/rinsing/spinning) — with a remaining-time countdown
 * and progress %. Falls back to the curated input_select.
 *
 * Dryer: no cycle API, so running/finished comes from the user's server-side
 * `input_select.dryer_state` (survives the kiosk's wake-refresh reloads, unlike a
 * client-side power debounce), with live wattage as the sub-line + a >50 W fallback.
 *
 * The plug POWER switch is always surfaced; `powerOff` flags a machine that can't
 * run because its switch is off (rendered loudly, never greyed out).
 */
const RUN_STATES = ["running", "run", "washing", "wash", "rinsing", "rinse", "spinning", "spin", "drying", "dry", "soak", "in_use", "cooling", "steam"];
const DONE_STATES = ["finished", "finish", "complete", "completed", "end", "done"];

const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

export function useLaundry() {
  const { entities } = useHA();
  const st = (id) => (id ? entities[id]?.state : undefined);
  const numOf = (id) => {
    const v = Number(st(id));
    return Number.isFinite(v) ? v : NaN;
  };

  const machines = ENTITIES.laundry.map((m) => {
    const plugState = m.plug ? st(m.plug) : undefined;
    const plugUnavail = m.plug ? !plugState || plugState === "unavailable" : false;
    const plugOn = plugState === "on";
    const powerOff = !!m.plug && !plugOn && !plugUnavail;
    const powerW = m.power ? numOf(m.power) : NaN;

    let running = false;
    let done = false;
    let progress = null;
    let remainingMin = null;
    let label;
    let sub;

    if (m.id === "washer") {
      const status = (st(m.status) || "").toLowerCase();
      const sm = (st(m.entity) || "").toLowerCase();
      running = RUN_STATES.includes(status) || sm === "running";
      done = !running && (DONE_STATES.includes(status) || sm === "finished");

      const remIso = st(m.remaining);
      if (remIso && !["unknown", "unavailable"].includes(remIso)) {
        const t = Date.parse(remIso);
        if (Number.isFinite(t)) remainingMin = Math.max(0, Math.round((t - Date.now()) / 60000));
      }
      const total = numOf(m.total);
      if (running && Number.isFinite(total) && total > 0 && remainingMin != null) {
        progress = Math.min(100, Math.max(0, Math.round(((total - remainingMin) / total) * 100)));
      }

      label = running ? cap(status) || "Running" : done ? "Done" : powerOff ? "Power off" : "Idle";
      sub = running
        ? remainingMin != null
          ? `${remainingMin} min left${Number.isFinite(powerW) ? ` · ${Math.round(powerW)} W` : ""}`
          : "In progress"
        : done
          ? "Unload the washer"
          : powerOff
            ? "Powered off · won't run until switched on"
            : "Ready";
    } else {
      const sm = (st(m.entity) || "").toLowerCase();
      running = sm === "running" || (Number.isFinite(powerW) && powerW > 50);
      done = !running && sm === "finished";

      label = running ? "Running" : done ? "Done" : powerOff ? "Power off" : "Idle";
      sub = running
        ? Number.isFinite(powerW)
          ? `Drying · ${(powerW / 1000).toFixed(2)} kW`
          : "Drying"
        : done
          ? "Unload the dryer"
          : powerOff
            ? "Powered off · won't run until switched on"
            : "Ready";
    }

    return {
      ...m,
      plugOn,
      plugUnavail,
      powerOff,
      powerW,
      running,
      done,
      progress,
      remainingMin,
      label,
      sub,
    };
  });

  return {
    machines,
    anyRunning: machines.some((m) => m.running),
    anyDone: machines.some((m) => m.done),
    anyPowerOff: machines.some((m) => m.powerOff),
  };
}
