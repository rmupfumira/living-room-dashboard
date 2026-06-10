import { ACCENTS } from "../lib/accent";

/**
 * Floating accent picker — bottom-right swatch row. Stays small and out of the
 * way; clicking a swatch immediately re-themes the UI.
 */
export default function AccentPicker({ accent, onPick }) {
  return (
    <div className="tweaks" role="group" aria-label="Accent colour">
      <span className="mlabel">Accent</span>
      {Object.keys(ACCENTS).map((hex) => (
        <button
          key={hex}
          type="button"
          className={"swatch" + (accent === hex ? " on" : "")}
          style={{ background: hex }}
          onClick={() => onPick(hex)}
          aria-label={`Accent ${hex}`}
        />
      ))}
    </div>
  );
}
