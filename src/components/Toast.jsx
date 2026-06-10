import * as L from "lucide-react";

/**
 * Bottom-center transient notification. Rendered by App.jsx when there's a
 * current toast in state; lifetime/dismissal is managed by App.
 *
 * Pulls the icon by Pascal-cased name from lucide-react so callers can pass
 * the string form (`fireToast("sparkles", "Scene activated")`).
 */
function toPascal(name) {
  return name
    .split(/[-_]/)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join("");
}

export default function Toast({ toast }) {
  if (!toast) return null;
  const Icon = L[toPascal(toast.icon)] || L.Sparkles;
  return (
    <div className="toast-wrap">
      <div className="toast">
        <Icon size={15} strokeWidth={2} className="ic" />
        {toast.msg}
      </div>
    </div>
  );
}
