import { HousePlug, LayoutDashboard, Zap, Cpu, Mic, BarChart3, Cctv, Settings } from "lucide-react";

/**
 * Floating capsule rail — fixed left-side 92px wide.
 * The non-Home buttons are decorative for now; clicking them fires a toast
 * via the parent's onPick callback.
 */
const ITEMS = [
  { id: "home", Icon: LayoutDashboard, label: "Home" },
  { id: "energy", Icon: Zap, label: "Energy" },
  { id: "devices", Icon: Cpu, label: "Devices" },
  { id: "voice", Icon: Mic, label: "Voice" },
  { id: "stats", Icon: BarChart3, label: "Stats" },
  { id: "cameras", Icon: Cctv, label: "Cameras" },
];

export default function Rail({ view, onPick }) {
  return (
    <nav className="rail">
      <div className="rail-logo" aria-hidden="true">
        <HousePlug size={22} strokeWidth={2} />
      </div>
      {ITEMS.map(({ id, Icon, label }) => (
        <button
          key={id}
          type="button"
          className={"rail-btn" + (view === id ? " active" : "")}
          onClick={() => onPick(id, label)}
          aria-label={label}
          title={label}
        >
          <Icon size={20} strokeWidth={2} />
        </button>
      ))}
      <div className="rail-spacer" />
      <button type="button" className="rail-btn" aria-label="Settings" title="Settings">
        <Settings size={20} strokeWidth={2} />
      </button>
      <div className="rail-avatar" aria-hidden="true">W</div>
    </nav>
  );
}
