import { useEffect, useRef } from "react";
import { Disc3, Cast, SkipBack, SkipForward, Play, Pause } from "lucide-react";
import { fmtDur } from "../lib/format";
import Led from "./Led";

/**
 * Music card. Caller owns the playback state (idx/progress/playing/queue)
 * and exposes set/next/prev/togglePlay handlers. We tick progress here so
 * the parent doesn't need its own interval just for music.
 */
export default function NowPlaying({ music, state, onSet, onNext, onPrev, onTogglePlay }) {
  const seekRef = useRef(null);
  const draggingRef = useRef(false);
  const track = music.queue[state.idx];

  // Tick progress every second while playing — local effect, parent stays clean.
  useEffect(() => {
    if (!state.playing) return;
    const id = setInterval(() => {
      const next = state.progress + 1;
      if (next >= track.dur) {
        onNext();
      } else {
        onSet({ progress: next });
      }
    }, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.playing, state.progress, state.idx]);

  const seek = (clientX) => {
    const node = seekRef.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    const frac = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    onSet({ progress: frac * track.dur });
  };

  useEffect(() => {
    const move = (e) => {
      if (!draggingRef.current) return;
      const pt = e.touches ? e.touches[0] : e;
      seek(pt.clientX);
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
  }, [state.idx]);

  const pct = (state.progress / track.dur) * 100;

  return (
    <div className="card rise" style={{ gridColumn: "span 6" }}>
      <div className="np-top">
        <div className="np-art">
          {state.playing ? (
            <>
              <div className="np-eq on">
                <span />
                <span />
                <span />
                <span />
              </div>
            </>
          ) : (
            <Disc3 size={28} strokeWidth={1.8} />
          )}
        </div>
        <div className="np-meta">
          <div className="np-device">
            <Led tone="on" />
            <span className="mlabel">
              <Cast size={11} strokeWidth={2} style={{ verticalAlign: "-2px", marginRight: 4 }} />
              {music.device}
            </span>
          </div>
          <div className="np-title">{track.title}</div>
          <div className="np-artist">{track.artist}</div>
        </div>
      </div>

      <div className="np-seek">
        <span className="np-seek-t">{fmtDur(state.progress)}</span>
        <div
          ref={seekRef}
          className="seekbar"
          onMouseDown={(e) => {
            draggingRef.current = true;
            seek(e.clientX);
          }}
          onTouchStart={(e) => {
            draggingRef.current = true;
            seek(e.touches[0].clientX);
          }}
        >
          <div className="seekfill" style={{ width: `${pct}%` }}>
            <span className="seekdot" />
          </div>
        </div>
        <span className="np-seek-t r">{fmtDur(track.dur)}</span>
      </div>

      <div className="np-ctrls">
        <button type="button" className="mc" onClick={onPrev} aria-label="Previous">
          <SkipBack size={16} strokeWidth={2} />
        </button>
        <button type="button" className="mc play" onClick={onTogglePlay} aria-label="Play/Pause">
          {state.playing ? <Pause size={18} strokeWidth={2} /> : <Play size={18} strokeWidth={2} />}
        </button>
        <button type="button" className="mc" onClick={onNext} aria-label="Next">
          <SkipForward size={16} strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}
