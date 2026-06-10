import { HousePlug, LayoutDashboard, Cctv, Sparkles, Zap, Settings } from "lucide-react";

/**
 * Left rail — fixed-width vertical nav. The logo is purely decorative;
 * Cameras/Scenes/Power buttons fire a toast (out of scope for this build).
 */
const ITEMS = [
  { id: "dashboard", Icon: LayoutDashboard, label: "Home" },
  { id: "cameras", Icon: Cctv, label: "Cameras" },
  { id: "scenes", Icon: Sparkles, label: "Scenes" },
  { id: "power", Icon: Zap, label: "Power" },
];

export default function Rail({ view, onPick }) {
  return (
    <nav className="rail">
      <div className="rail-logo">
        <HousePlug size={22} strokeWidth={2} />
      </div>
      {ITEMS.map(({ id, Icon, label }) => (
        <button
          key={id}
          type="button"
          className={"rail-btn" + (view === id ? " active" : "")}
          onClick={() => onPick(id, label)}
          title={label}
          aria-label={label}
        >
          <Icon size={20} strokeWidth={2} />
        </button>
      ))}
      <div className="rail-spacer" />
      <button type="button" className="rail-btn" title="Settings" aria-label="Settings">
        <Settings size={20} strokeWidth={2} />
      </button>
    </nav>
  );
}
