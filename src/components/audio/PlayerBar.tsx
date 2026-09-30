import { Pause, Play, RotateCcw, RotateCw, SkipBack, SkipForward, X } from "lucide-react";
import { PARTS, formatClock, partDuration } from "@/data/audio";
import { cn } from "@/lib/utils";
import { useAudio, useAudioControls } from "./AudioProvider";

const RATES = [0.85, 1, 1.25, 1.5];

/** The docked player. Shown once something has been played. */
export function PlayerBar() {
  const part = useAudio((s) => s.part);
  const playing = useAudio((s) => s.playing);
  const time = useAudio((s) => Math.floor(s.time));
  const rate = useAudio((s) => s.rate);
  const follow = useAudio((s) => s.follow);
  const c = useAudioControls();
  if (!part) return null;

  const index = PARTS.findIndex((p) => p.id === part);
  const meta = PARTS[index];
  const duration = partDuration(part);
  const button =
    "flex size-11 shrink-0 items-center justify-center text-paper hover:text-brass disabled:opacity-35";

  return (
    <div
      data-player-bar
      role="region"
      aria-label="Audio player"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-rule bg-ink/95 backdrop-blur-md"
    >
      <div className="mx-auto max-w-4xl px-3 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:px-6">
        <div className="flex items-center gap-2">
          <p className="min-w-0 flex-1 truncate font-sans text-[0.68rem] tracking-[0.14em] text-brass uppercase">
            <span className="text-muted">
              {index + 1}/{PARTS.length}
            </span>{" "}
            {meta.title}
          </p>
          <button type="button" className={button} onClick={c.close} aria-label="Close the player">
            <X className="size-5" />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-12 shrink-0 text-right font-sans text-[0.72rem] text-fog tabular-nums">
            {formatClock(time)}
          </span>
          <input
            type="range"
            min={0}
            max={Math.round(duration)}
            step={1}
            value={Math.min(time, Math.round(duration))}
            onChange={(e) => c.seek(Number(e.target.value))}
            aria-label="Position in this part"
            aria-valuetext={`${formatClock(time)} of ${formatClock(duration)}`}
            className="h-11 min-w-0 flex-1 accent-[var(--color-brass)]"
          />
          <span className="w-12 shrink-0 font-sans text-[0.72rem] text-fog tabular-nums">
            {formatClock(duration)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-1">
          <div className="flex items-center">
            <button
              type="button"
              className={button}
              onClick={() => c.step(-1)}
              disabled={index === 0}
              aria-label="Previous part"
            >
              <SkipBack className="size-5" />
            </button>
            <button
              type="button"
              className={button}
              onClick={() => c.skip(-15)}
              aria-label="Back 15 seconds"
            >
              <RotateCcw className="size-5" />
            </button>
            <button
              type="button"
              onClick={c.toggle}
              aria-label={playing ? "Pause" : "Play"}
              className="mx-1 flex size-12 items-center justify-center rounded-full bg-brass text-ink hover:bg-paper"
            >
              {playing ? <Pause className="size-5" /> : <Play className="size-5 translate-x-px" />}
            </button>
            <button
              type="button"
              className={button}
              onClick={() => c.skip(15)}
              aria-label="Forward 15 seconds"
            >
              <RotateCw className="size-5" />
            </button>
            <button
              type="button"
              className={button}
              onClick={() => c.step(1)}
              disabled={index === PARTS.length - 1}
              aria-label="Next part"
            >
              <SkipForward className="size-5" />
            </button>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => c.setRate(RATES[(RATES.indexOf(rate) + 1) % RATES.length])}
              aria-label={`Playback speed ${rate}×. Change speed.`}
              className="flex min-h-11 min-w-11 items-center justify-center font-sans text-[0.78rem] text-fog tabular-nums hover:text-paper"
            >
              {rate}×
            </button>
            <button
              type="button"
              onClick={() => c.setFollow(!follow)}
              aria-pressed={follow}
              className={cn(
                "flex min-h-11 items-center px-2 font-sans text-[0.68rem] tracking-[0.14em] uppercase",
                follow ? "text-brass" : "text-muted hover:text-paper",
              )}
            >
              Follow
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Keeps the page's end clear of the docked player. */
export function PlayerSpacer() {
  const part = useAudio((s) => s.part);
  return part ? <div aria-hidden className="h-40 shrink-0" /> : null;
}
