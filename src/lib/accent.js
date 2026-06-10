/**
 * Accent system.
 *
 * Curated hues, all sharing the same lightness/chroma structure so that a single
 * hex pick re-tunes the whole UI consistently. The picker swatches show the
 * dark-mode hex values for visual recognition; `applyAccent` deepens the ramp
 * in light mode so the colour stays legible on white panels.
 *
 * The four properties written here (`--argon`, `--argon-deep`, `--argon-dim`,
 * `--argon-glow`) are referenced by every component — see nocturne.css.
 */

export const ACCENTS = {
  "#5fe3b0": 168, // argon mint (default)
  "#4cc4ff": 232, // ice cyan
  "#9d8bff": 290, // iris violet
  "#ff8a5c": 55,  // ember
  "#ff5d8f": 5,   // rose
  "#b8f24a": 128, // lime
};

export function applyAccent(hex, dark) {
  const H = ACCENTS[hex] ?? 168;
  const root = document.documentElement;
  const set = (k, v) => root.style.setProperty(k, v);

  if (dark) {
    set("--argon", `oklch(0.885 0.170 ${H})`);
    set("--argon-deep", `oklch(0.820 0.160 ${H})`);
    set("--argon-dim", `oklch(0.560 0.095 ${H})`);
    set("--argon-glow", `oklch(0.885 0.170 ${H})`);
  } else {
    // Light mode — deepen so the accent reads against white panels.
    set("--argon", `oklch(0.640 0.165 ${H})`);
    set("--argon-deep", `oklch(0.560 0.165 ${H})`);
    set("--argon-dim", `oklch(0.720 0.110 ${H})`);
    set("--argon-glow", `oklch(0.700 0.170 ${H})`);
  }
}
