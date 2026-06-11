import * as L from "lucide-react";

function toPascal(name) {
  return String(name)
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
