import { useEffect, useMemo, useRef, useState } from "react";
import { SkipBack, SkipForward, Play, Pause, Cast, Volume2, Music, Shuffle, Repeat } from "lucide-react";
import Led from "./Led";
import { ENTITIES } from "../entities";
import { useEntity } from "../ha/HaContext";
import { useService, haUrl } from "../ha/useService";
import { fmtDur } from "../lib/format";

/**
 * Compute live media_position. HA reports a snapshot + a timestamp; we
 * extrapolate "where the track is right now" based on elapsed wall-clock.
 */
function livePosition(ent) {
  if (!ent) return 0;
  const pos = Number(ent.attributes?.media_position);
  if (!Number.isFinite(pos)) return 0;
  const since = ent.attributes?.media_position_updated_at;
  if (ent.state === "playing" && since) {
    const elapsed = (Date.now() - new Date(since).getTime()) / 1000;
    return Math.max(0, pos + elapsed);
  }
  return pos;
}

export default function MediaCard({ onToast }) {
  const ent = useEntity(ENTITIES.media);
  const call = useService();

  const playing = ent?.state === "playing";
  const duration = Number(ent?.attributes?.media_duration) || 0;
  const title = ent?.attributes?.media_title || "—";
  const artist = ent?.attributes?.media_artist || (ent?.state === "off" ? "Off" : "—");
  const device = ent?.attributes?.friendly_name || "Living Room";
  const artPath = ent?.attributes?.entity_picture;
  const art = artPath ? haUrl(artPath) : "";

  // Tick once per second so the seek bar moves while playing.
  const [, force] = useState(0);
  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => force((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, [playing]);

  const pos = livePosition(ent);
  const pct = duration > 0 ? Math.min(100, (pos / duration) * 100) : 0;

  // Seek + scrub.
  const seekRef = useRef(null);
  const draggingRef = useRef(false);
  const doSeek = (clientX) => {
    if (!duration) return;
    const node = seekRef.current;
    if (!node) return;
    const r = node.getBoundingClientRect();
    const frac = Math.max(0, Math.min(1, (clientX - r.left) / r.width));
    const target = frac * duration;
    call("media_player", "media_seek", { seek_position: target }, { entity_id: ENTITIES.media });
  };
  useEffect(() => {
    const move = (e) => {
      if (!draggingRef.current) return;
      const pt = e.touches ? e.touches[0] : e;
      doSeek(pt.clientX);
    };
    const up = () => {
      draggingRef.current = false;
    };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
    window.addEventListener("touchmove", move, { passive: false });
    window.addEventListener("touchend", up);
    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
      window.removeEventListener("touchmove", move);
      window.removeEventListener("touchend", up);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [duration]);

  const togglePlay = () => {
    onToast?.(playing ? "pause" : "play", playing ? "Paused" : "Playing");
    call("media_player", "media_play_pause", {}, { entity_id: ENTITIES.media });
  };
  const next = () => call("media_player", "media_next_track", {}, { entity_id: ENTITIES.media });
  const prev = () => call("media_player", "media_previous_track", {}, { entity_id: ENTITIES.media });
  const shuffle = ent?.attributes?.shuffle;
  const repeat = ent?.attributes?.repeat;
  const toggleShuffle = () =>
    call("media_player", "shuffle_set", { shuffle: !shuffle }, { entity_id: ENTITIES.media });
  const cycleRepeat = () => {
    const nextR = repeat === "off" ? "all" : repeat === "all" ? "one" : "off";
    call("media_player", "repeat_set", { repeat: nextR }, { entity_id: ENTITIES.media });
  };

  return (
    <div className="span-media" style={{ gridColumn: "span 5" }}>
      <div className="card rise">
        <div className="card-head">
          <div className="card-ic" style={{ color: "var(--blue)" }}>
            <Volume2 size={18} strokeWidth={2} />
          </div>
          <div>
            <div className="card-title">Media Player</div>
            <div className="card-sub mlabel">{device}</div>
          </div>
        </div>

        <div className="media-top">
          <div className="media-art">
            {art ? (
              <img src={art} alt="" onError={(e) => { e.currentTarget.style.display = "none"; }} />
            ) : (
              <Music size={32} strokeWidth={1.6} />
            )}
            <div className={"media-eq" + (playing ? " on" : "")}>
              <span /><span /><span /><span />
            </div>
          </div>
          <div className="media-meta">
            <div className="media-device">
              <Led tone={playing ? "on" : "default"} />
              <span className="mlabel">
                <Cast size={11} strokeWidth={2} style={{ verticalAlign: "-2px", marginRight: 4 }} />
                {device}
              </span>
            </div>
            <div className="media-title">{title}</div>
            <div className="media-artist">{artist}</div>
          </div>
        </div>

        <div className="media-seek">
          <span className="media-seek-t">{fmtDur(pos)}</span>
          <div
            ref={seekRef}
            className="seekbar"
            onMouseDown={(e) => {
              if (!duration) return;
              draggingRef.current = true;
              doSeek(e.clientX);
            }}
            onTouchStart={(e) => {
              if (!duration) return;
              draggingRef.current = true;
              doSeek(e.touches[0].clientX);
            }}
          >
            <div className="seekfill" style={{ width: `${pct}%` }}>
              <span className="seekdot" />
            </div>
          </div>
          <span className="media-seek-t r">{duration ? fmtDur(duration) : "—:—"}</span>
        </div>

        <div className="media-ctrls">
          <button type="button" className={"mc" + (shuffle ? " act" : "")} onClick={toggleShuffle} aria-label="Shuffle">
            <Shuffle size={16} strokeWidth={2} />
          </button>
          <button type="button" className="mc" onClick={prev} aria-label="Previous">
            <SkipBack size={16} strokeWidth={2} />
          </button>
          <button type="button" className="mc play" onClick={togglePlay} aria-label="Play/Pause">
            {playing ? <Pause size={18} strokeWidth={2} /> : <Play size={18} strokeWidth={2} />}
          </button>
          <button type="button" className="mc" onClick={next} aria-label="Next">
            <SkipForward size={16} strokeWidth={2} />
          </button>
          <button
            type="button"
            className={"mc" + (repeat && repeat !== "off" ? " act" : "")}
            onClick={cycleRepeat}
            aria-label="Repeat"
            title={`Repeat: ${repeat || "off"}`}
          >
            <Repeat size={16} strokeWidth={2} />
          </button>
        </div>
      </div>
    </div>
  );
}
