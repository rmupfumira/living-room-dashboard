import { ShieldOff } from "lucide-react";
import { ENTITIES } from "../entities";
import { useEntity } from "../ha/HaContext";
import { useService } from "../ha/useService";

/**
 * Guest Mode is a security risk if left on (it suspends security automations),
 * so when active it gets two unmissable, reinforcing signals across every view:
 *   • a pulsing amber frame around the entire screen (ambient, blocks nothing)
 *   • a floating banner naming it, with a one-tap End (restores security)
 * The idle clock screensaver carries its own guest-mode chip too.
 */
export default function GuestModeAlert({ onToast }) {
  const ent = useEntity(ENTITIES.guestMode);
  const call = useService();
  if (ent?.state !== "on") return null;

  const end = () => {
    onToast?.("shield-check", "Guest Mode ended — security restored");
    call("input_boolean", "turn_off", {}, { entity_id: ENTITIES.guestMode });
  };

  return (
    <>
      <div className="gm-frame" aria-hidden="true" />
      <div className="gm-banner" role="status">
        <ShieldOff size={24} strokeWidth={2.2} />
        <div className="gm-banner-txt">
          <span className="gm-banner-t">Guest Mode active</span>
          <span className="gm-banner-s">Security automations are paused</span>
        </div>
        <button type="button" className="gm-end" onClick={end}>End</button>
      </div>
    </>
  );
}
