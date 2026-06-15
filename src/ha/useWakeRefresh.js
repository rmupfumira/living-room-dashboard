import { useEffect, useRef } from "react";
import { useHA } from "./HaContext";

/**
 * Keep a long-running wall-panel fresh.
 *
 * Two mechanisms, both ending in a cache-light hard reload:
 *
 *  1. Staleness watchdog (the real fix for "the dashboard goes stale"):
 *     the app is a live websocket — if the socket quietly dies (kiosk Wi-Fi
 *     sleep / half-open TCP) entity updates stop arriving. We track the time
 *     of the last state push; if nothing has arrived for STALE_MS we reload.
 *
 *  2. Motion / presence wake: when the room's occupancy sensor flips to
 *     "detected", we reload too — so the panel shows current data the moment
 *     someone walks up. (Reloads only if stale, or if the page has been up
 *     longer than FRESHEN_MS, to also clear any accumulated browser jank.)
 *
 * Guards: never reload before the app has ever received data (that's the
 * OfflineOverlay's job), never within COOLDOWN_MS of the last reload, never
 * within INTERACT_MS of a tap/keypress (don't yank a page out from under
 * someone), and never while the tab is hidden.
 */
const STALE_MS = 90_000;          // no data for this long → reload
const COOLDOWN_MS = 60_000;       // at most one reload per minute
const FRESHEN_MS = 15 * 60_000;   // motion also reloads a page older than this
const INTERACT_MS = 20_000;       // skip reload within 20s of user input
const CHECK_MS = 20_000;          // watchdog tick

export function useWakeRefresh(wakeEntityId) {
  const { entities } = useHA();

  const lastUpdate = useRef(Date.now());
  const everUpdated = useRef(false);
  const lastReload = useRef(Date.now()); // page load counts as a reload
  const lastInteract = useRef(0);
  const wakePrev = useRef(undefined);
  const maybeReloadRef = useRef(() => {});

  // Mark data freshness on every state push from HA.
  useEffect(() => {
    if (entities && Object.keys(entities).length) {
      lastUpdate.current = Date.now();
      everUpdated.current = true;
    }
  }, [entities]);

  // Watchdog + wake-on-window-events. Set up once.
  useEffect(() => {
    const reload = () => {
      const url = new URL(window.location.href);
      url.searchParams.set("_r", String(Date.now()));
      window.location.replace(url.toString());
    };
    const maybeReload = (freshen) => {
      if (!everUpdated.current) return;                       // never worked yet
      if (document.visibilityState !== "visible") return;
      const now = Date.now();
      if (now - lastReload.current < COOLDOWN_MS) return;
      if (now - lastInteract.current < INTERACT_MS) return;   // in active use
      const stale = now - lastUpdate.current > STALE_MS;
      const aged = now - lastReload.current > FRESHEN_MS;
      if (stale || (freshen && aged)) {
        lastReload.current = now;
        reload();
      }
    };
    maybeReloadRef.current = maybeReload;

    const mark = () => { lastInteract.current = Date.now(); };
    const onWake = () => { if (document.visibilityState === "visible") maybeReload(false); };

    const id = setInterval(() => maybeReload(false), CHECK_MS);
    window.addEventListener("pointerdown", mark, true);
    window.addEventListener("keydown", mark, true);
    document.addEventListener("visibilitychange", onWake);
    window.addEventListener("online", onWake);
    window.addEventListener("focus", onWake);

    return () => {
      clearInterval(id);
      window.removeEventListener("pointerdown", mark, true);
      window.removeEventListener("keydown", mark, true);
      document.removeEventListener("visibilitychange", onWake);
      window.removeEventListener("online", onWake);
      window.removeEventListener("focus", onWake);
    };
  }, []);

  // Motion / presence wake — fire on the off→on (or 0→>0) transition.
  const wakeState = wakeEntityId ? entities[wakeEntityId]?.state : undefined;
  useEffect(() => {
    if (wakeState === undefined) return;
    const n = Number(wakeState);
    const detected = wakeState === "on" || (Number.isFinite(n) && n > 0);
    const prev = wakePrev.current;
    wakePrev.current = detected;
    if (detected && prev === false) maybeReloadRef.current(true);
  }, [wakeState]);
}
