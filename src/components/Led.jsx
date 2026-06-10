/**
 * 7px status LED. Variants: default · on (argon) · warn · alert · info.
 * Add the `pulse` flag for the live "is-this-still-alive?" heartbeat.
 */
export default function Led({ tone = "default", pulse = false }) {
  const classes = ["led"];
  if (tone === "on") classes.push("on");
  else if (tone === "warn") classes.push("warn");
  else if (tone === "alert") classes.push("alert");
  else if (tone === "info") classes.push("info");
  if (pulse) classes.push("pulse");
  return <span className={classes.join(" ")} aria-hidden="true" />;
}
