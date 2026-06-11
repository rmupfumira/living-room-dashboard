import * as L from "lucide-react";
import { Sparkles } from "lucide-react";
import { ENTITIES } from "../entities";
import { useEntity } from "../ha/HaContext";
import { useService } from "../ha/useService";

function toPascal(name) {
  return String(name)
    .split(/[-_]/)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join("");
}

/**
 * Single scene row — clickable. Renders purple→magenta when the underlying
 * input_boolean is on; scenes (one-shot triggers) never persist `on` so they
 * just flash via the toast.
 */
function SceneRow({ scene, onActivate }) {
  const ent = useEntity(scene.entity);
  const domain = scene.entity.split(".")[0];
  const Icon = L[toPascal(scene.icon)] || Sparkles;
  // input_boolean reflects its state; scene.* always idle (timestamp state).
  const on = domain === "input_boolean" && ent?.state === "on";

  return (
    <div
      className={"scene-row" + (on ? " on" : "")}
      onClick={() => onActivate(scene)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onActivate(scene);
      }}
    >
      <div className="scene-ic">
        <Icon size={18} strokeWidth={2} />
      </div>
      <div className="scene-meta">
        <div className="scene-name">{scene.name}</div>
        <div className="scene-sub mlabel">{on ? "Active" : "Tap to run"}</div>
      </div>
    </div>
  );
}

export default function ScenesCard({ onToast }) {
  const call = useService();

  const activate = async (scene) => {
    const domain = scene.entity.split(".")[0];
    onToast?.("sparkles", `${scene.name} activated`);
    if (domain === "scene") {
      await call("scene", "turn_on", {}, { entity_id: scene.entity });
    } else if (domain === "input_boolean") {
      await call("input_boolean", "toggle", {}, { entity_id: scene.entity });
    } else if (domain === "script") {
      await call("script", "turn_on", {}, { entity_id: scene.entity });
    } else if (domain === "automation") {
      await call("automation", "trigger", {}, { entity_id: scene.entity });
    } else {
      await call(domain, "turn_on", {}, { entity_id: scene.entity });
    }
  };

  return (
    <div className="span-scenes" style={{ gridColumn: "span 4" }}>
      <div className="card rise">
        <div className="card-head">
          <div className="card-ic" style={{ color: "var(--purple)" }}>
            <Sparkles size={18} strokeWidth={2} />
          </div>
          <div>
            <div className="card-title">Scenes</div>
            <div className="card-sub mlabel">One tap moods</div>
          </div>
        </div>
        <div className="scene-list">
          {ENTITIES.scenes.map((s) => (
            <SceneRow key={s.id} scene={s} onActivate={activate} />
          ))}
        </div>
      </div>
    </div>
  );
}
