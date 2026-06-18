import { useState } from "react";
import { SkipBack, SkipForward, Play, Pause, Music, Volume1, Volume2, ChevronDown, Speaker, Check } from "lucide-react";
import { ENTITIES } from "../entities";
import { useEntity } from "../ha/HaContext";
import { useService, haUrl } from "../ha/useService";

/**
 * Kitchen "Now Playing" card, driven by Music Assistant.
 * Controls one MA player at a time (default = the scullery/kitchen speaker);
 * the device button opens a picker to switch which MA player it drives.
 */
export default function MusicCard({ onToast }) {
  const players = ENTITIES.music.players;
  const [entId, setEntId] = useState(ENTITIES.music.default);
  const [pickOpen, setPickOpen] = useState(false);
  const ent = useEntity(entId);
  const call = useService();

  const playing = ent?.state === "playing";
  const unavail = !ent || ent.state === "unavailable";
  const mediaTitle = ent?.attributes?.media_title;
  const title = mediaTitle || (unavail ? "Unavailable" : "Nothing playing");
  const artist = ent?.attributes?.media_artist || "";
  const album = ent?.attributes?.media_album_name || "";
  const artPath = ent?.attributes?.entity_picture;
  const art = artPath ? haUrl(artPath) : "";
  const vol = Number(ent?.attributes?.volume_level);
  const volPct = Number.isFinite(vol) ? Math.round(vol * 100) : 30;
  const devName = players.find((p) => p.entity === entId)?.name || ent?.attributes?.friendly_name || "Speaker";

  const svc = (s, data = {}) => call("media_player", s, data, { entity_id: entId });
  const togglePlay = () => {
    onToast?.(playing ? "pause" : "play", playing ? "Paused" : "Playing");
    svc("media_play_pause");
  };
  const pick = (p) => {
    setEntId(p.entity);
    setPickOpen(false);
    onToast?.("speaker", p.name);
  };

  return (
    <div className="nowp rise">
      <div className="nowp-h"><Music size={15} strokeWidth={2.2} /> Now Playing</div>

      <div className="nowp-main">
        <div className="nowp-art">
          {art ? <img src={art} alt="" onError={(e) => { e.currentTarget.style.display = "none"; }} /> : <Music size={42} strokeWidth={1.4} />}
        </div>
        <div className="nowp-info">
          <div className="nowp-title" title={title}>{title}</div>
          {artist && <div className="nowp-artist">{artist}</div>}
          {album && <div className="nowp-album">{album}</div>}
        </div>
      </div>

      <div className="nowp-ctrls">
        <button type="button" className="nowp-btn" onClick={() => svc("media_previous_track")} disabled={unavail} aria-label="Previous">
          <SkipBack size={20} strokeWidth={2} />
        </button>
        <button type="button" className="nowp-btn play" onClick={togglePlay} disabled={unavail} aria-label="Play/Pause">
          {playing ? <Pause size={26} strokeWidth={2.2} /> : <Play size={26} strokeWidth={2.2} />}
        </button>
        <button type="button" className="nowp-btn" onClick={() => svc("media_next_track")} disabled={unavail} aria-label="Next">
          <SkipForward size={20} strokeWidth={2} />
        </button>
      </div>

      <div className="nowp-vol">
        <Volume1 size={18} strokeWidth={2} color="var(--ink-mute)" />
        <input
          type="range" className="klx-slider" min={0} max={100} value={volPct} disabled={unavail}
          onChange={(e) => svc("volume_set", { volume_level: Number(e.target.value) / 100 })}
          style={{ ["--vp"]: `${volPct}%` }} aria-label="Volume"
        />
        <Volume2 size={18} strokeWidth={2} color="var(--ink-mute)" />
      </div>

      <div className="nowp-dev">
        <button type="button" className="nowp-dev-btn" onClick={() => setPickOpen((o) => !o)} aria-label="Output device">
          <Speaker size={16} strokeWidth={2} />
          <span>{devName}</span>
          <ChevronDown size={16} strokeWidth={2.2} className={pickOpen ? "flip" : ""} />
        </button>
        {pickOpen && (
          <div className="nowp-pick">
            {players.map((p) => (
              <button type="button" key={p.id} className={"nowp-pick-i" + (p.entity === entId ? " on" : "")} onClick={() => pick(p)}>
                <Speaker size={15} strokeWidth={2} />
                <span>{p.name}</span>
                {p.entity === entId && <Check size={15} strokeWidth={2.6} />}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
