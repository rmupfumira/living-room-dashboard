/**
 * Pill toggle — 44×25, on-state glows in the active accent.
 * Stops click propagation so it can sit inside a clickable card without
 * double-triggering the card's onClick.
 */
export default function Switch({ on, onClick, ariaLabel = "toggle" }) {
  return (
    <button
      type="button"
      className={"switch" + (on ? " on" : "")}
      onClick={(e) => {
        e.stopPropagation();
        onClick && onClick();
      }}
      aria-pressed={on}
      aria-label={ariaLabel}
    />
  );
}
