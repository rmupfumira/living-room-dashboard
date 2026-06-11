/**
 * 7px status LED. Tones: default · on · alert · warn · success · info.
 * Set `pulse` for live heartbeat.
 */
export default function Led({ tone = "default", pulse = false }) {
  const cls = ["led"];
  if (tone !== "default") cls.push(tone);
  if (pulse) cls.push("pulse");
  return <span className={cls.join(" ")} aria-hidden="true" />;
}
