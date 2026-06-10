/**
 * Section divider for the dashboard grid — spans all 12 columns.
 * Argon bar + tracked-mono title + optional right slot (count, room tabs, etc).
 */
export default function SectionLabel({ children, right }) {
  return (
    <div className="section-label">
      <span className="section-bar" />
      <span className="mlabel">{children}</span>
      {right && <div className="right">{right}</div>}
    </div>
  );
}
