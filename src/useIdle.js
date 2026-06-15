import { useCallback, useEffect, useState } from "react";

/**
 * Idle detection for the screensaver.
 *
 * Returns [idle, wake]. Goes idle after `ms` with no user input (tap / key /
 * wheel / touch). `inhibit` forces it awake and pauses the timer — used so a
 * critical alert can never be hidden behind the clock.
 *
 * While idle the activity listeners are removed; the Screensaver overlay owns
 * the wake gesture (so the waking tap can't fall through to a control beneath).
 */
export function useIdle(ms, { inhibit = false } = {}) {
  const [idle, setIdle] = useState(false);

  useEffect(() => {
    if (idle || inhibit) return; // no timer while the clock is shown or inhibited
    let t;
    const arm = () => {
      clearTimeout(t);
      t = setTimeout(() => setIdle(true), ms);
    };
    const evs = ["pointerdown", "keydown", "wheel", "touchstart"];
    evs.forEach((e) => window.addEventListener(e, arm, true));
    arm();
    return () => {
      clearTimeout(t);
      evs.forEach((e) => window.removeEventListener(e, arm, true));
    };
  }, [idle, inhibit, ms]);

  const wake = useCallback(() => setIdle(false), []);
  return [idle && !inhibit, wake];
}
