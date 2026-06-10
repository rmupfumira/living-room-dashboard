import { Sun, Moon } from "lucide-react";

/**
 * Theme toggle — shows the icon that would happen if you tap it.
 * Caller does the actual `data-theme` flip + transition-kill (see App.jsx).
 */
export default function ThemeToggle({ dark, onToggle }) {
  return (
    <button
      type="button"
      className="icon-btn"
      onClick={onToggle}
      aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
      title={dark ? "Daybreak" : "Nocturne"}
    >
      {dark ? <Sun size={18} strokeWidth={2} /> : <Moon size={18} strokeWidth={2} />}
    </button>
  );
}
