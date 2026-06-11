/**
 * 46×27 pill toggle. Stops click propagation so it can sit inside clickable rows.
 */
export default function Switch({ on, onClick, ariaLabel = "toggle", disabled = false }) {
  return (
    <button
      type="button"
      className={"switch" + (on ? " on" : "")}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        if (!disabled && onClick) onClick();
      }}
      aria-pressed={on}
      aria-label={ariaLabel}
    />
  );
}
