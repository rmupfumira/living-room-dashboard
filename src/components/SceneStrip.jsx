import * as L from "lucide-react";

function toPascal(name) {
  return name
    .split(/[-_]/)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join("");
}

/**
 * Wide-row scene pills. Activation is one tap; the parent handles the
 * climate / security side-effects + the toast.
 */
export default function SceneStrip({ scenes, active, onRun }) {
  return (
    <div style={{ gridColumn: "span 12" }}>
      <div className="scene-strip">
        {scenes.map((s) => {
          const Icon = L[toPascal(s.icon)] || L.Sparkles;
          return (
            <button
              key={s.id}
              type="button"
              className={"scene-pill" + (active === s.id ? " on" : "")}
              onClick={() => onRun(s)}
            >
              <span className="sp-ic">
                <Icon size={16} strokeWidth={2} />
              </span>
              <span className="sp-tx">
                <b>{s.name}</b>
                <i>{s.desc}</i>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
