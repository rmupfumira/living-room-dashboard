/**
 * Tiny formatting helpers — kept dependency-free for clarity.
 */
const pad = (n) => String(n).padStart(2, "0");

/** Live clock string "HH:MM:SS" (24h). */
export function fmtTime(date) {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

/** Seek-bar mm:ss display for music tracks. */
export function fmtDur(seconds) {
  const s = Math.max(0, Math.round(seconds));
  return `${Math.floor(s / 60)}:${pad(s % 60)}`;
}

/** One-decimal absolute number — used in the energy stat values. */
export function f1(n) {
  return (Math.round(Math.abs(n) * 10) / 10).toFixed(1);
}
