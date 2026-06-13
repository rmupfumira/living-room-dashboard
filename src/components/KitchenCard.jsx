import { useState } from "react";
import { LampCeiling, Lightbulb, Zap, Power, ChevronDown } from "lucide-react";
import { ENTITIES } from "../entities";
import { useEntity, useHA } from "../ha/HaContext";
import { useService } from "../ha/useService";

const SWITCH_ICONS = { pendant: LampCeiling, down: Lightbulb, peninsula: Lightbulb };

/**
 * Big prominent switch/light card (correction 5) — name, %, slider all large.
 * Content distributed top-to-bottom so the tall card fills.
 */
function SwitchTile({ name, entity, Icon, onToast }) {
  const ent = useEntity(entity);
  const call = useService();
  const domain = entity.split(".")[0];
  const unavail = !ent || ent.state === "unavailable";
  const on = ent?.state === "on";
  const dimmable = domain === "light";
  const bri = ent?.attributes?.brightness ?? 0;
  const pct = on ? Math.round((bri / 255) * 100) : 0;

  const toggle = () => {
    if (unavail) return;
    onToast?.(on ? "power-off" : "power", `${name} ${on ? "off" : "on"}`);
    call(domain, "toggle", {}, { entity_id: entity });
  };
  const setBri = (p) => call("light", "turn_on", { brightness_pct: p }, { entity_id: entity });

  return (
    <div
      className={"klx-tile" + (on ? " on" : "") + (unavail ? " unavail" : "")}
      onClick={toggle}
      role="button"
      tabIndex={unavail ? -1 : 0}
      onKeyDown={(e) => {
        if ((e.key === "Enter" || e.key === " ") && !unavail) toggle();
      }}
    >
      <div className="klx-top">
        <div className="klx-ic">
          <Icon size={34} strokeWidth={2} />
        </div>
        <Power size={20} strokeWidth={2.2} color={on ? "var(--gold)" : "var(--ink-faint)"} />
      </div>
      <div className="klx-foot">
        <div className="klx-n">{name}</div>
        <div className="klx-pctline">
          {dimmable ? (
            <>
              <span className="klx-pct">{on ? `${pct}%` : "Off"}</span>
            </>
          ) : (
            <span className="klx-pct">{unavail ? "Offline" : on ? "On" : "Off"}</span>
          )}
        </div>
        {dimmable && (
          <input
            type="range"
            className="klx-slider"
            min={1}
            max={100}
            value={pct}
            disabled={unavail || !on}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => setBri(Number(e.target.value))}
            style={{ ["--vp"]: `${pct}%` }}
            aria-label={`${name} brightness`}
          />
        )}
      </div>
    </div>
  );
}

/** A single mini strip control inside the expanded strips bar. */
function StripMini({ strip }) {
  const ent = useEntity(strip.entity);
  const call = useService();
  const unavail = !ent || ent.state === "unavailable";
  const on = ent?.state === "on";
  const bri = ent?.attributes?.brightness ?? 0;
  const pct = on ? Math.round((bri / 255) * 100) : 0;

  const toggle = () => {
    if (unavail) return;
    call("light", "toggle", {}, { entity_id: strip.entity });
  };

  return (
    <div className={"klx-mini" + (on ? " on" : "") + (unavail ? " unavail" : "")}>
      <div className="klx-mini-top">
        <span className="klx-mini-n">{strip.name}</span>
        <span className="switch" style={{ transform: "scale(0.7)", transformOrigin: "right center" }} onClick={toggle} role="button" aria-label={strip.name} />
      </div>
      <div className="klx-mini-s">{unavail ? "Offline" : on ? `${pct}%` : "Off"}</div>
    </div>
  );
}

/**
 * Kitchen Lighting hero.
 * Top: 3 big switch cards (Pendant / Downlighters / Peninsula).
 * Bottom: collapsed expandable bar for the 6 WLED strips (correction 6) —
 * shows "LED Strips — N Devices Offline" when none are live.
 */
export default function KitchenCard({ onToast }) {
  const { entities } = useHA();
  const [open, setOpen] = useState(false);

  const strips = ENTITIES.kitchen.strips;
  const liveCount = strips.filter((s) => entities[s.entity] && entities[s.entity].state !== "unavailable").length;
  const offlineCount = strips.length - liveCount;
  const onCount = strips.filter((s) => entities[s.entity]?.state === "on").length;

  const stripsLabel =
    liveCount === 0
      ? `${strips.length} Devices Offline`
      : `${onCount} of ${strips.length} on · ${offlineCount} offline`;

  return (
    <div className="klx rise">
      <div className="klx-head">
        <span className="sect-title">Kitchen Lighting</span>
      </div>

      <div className="klx-switches">
        {ENTITIES.kitchen.switches.map((sw) => (
          <SwitchTile
            key={sw.id}
            name={sw.name}
            entity={sw.entity}
            Icon={SWITCH_ICONS[sw.id] || Lightbulb}
            onToast={onToast}
          />
        ))}
      </div>

      <div className={"klx-strips" + (open ? " open" : "")}>
        <div className="klx-strips-head" onClick={() => setOpen((o) => !o)} role="button" tabIndex={0}>
          <div className="klx-strips-ic">
            <Zap size={18} strokeWidth={2} color={liveCount ? "var(--gold)" : "var(--ink-mute)"} />
          </div>
          <div className="klx-strips-meta">
            <div className="klx-strips-n">LED Strips</div>
            <div className="klx-strips-s">{stripsLabel}</div>
          </div>
          <ChevronDown className="klx-strips-chev" size={20} strokeWidth={2} />
        </div>
        {open && (
          <div className="klx-strips-body">
            {strips.map((s) => (
              <StripMini key={s.id} strip={s} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
