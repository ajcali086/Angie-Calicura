import {
  ChevronDown,
  ChevronUp,
  Pause,
  Play,
  RotateCcw,
  RotateCw,
  SkipBack,
  SkipForward,
  X,
} from "lucide-react";
import { PARTS, formatClock, partDuration } from "@/data/audio";
import { cn } from "@/lib/utils";
import { useAudio, useAudioControls } from "./AudioProvider";

const RATES = [0.85, 1, 1.25, 1.5];

/**
 * The docked player. Shown once something has been played. While Follow is
 * on it keeps out of the way as a slim bar (play, part, progress) so the
 * page has the room; tapping it opens the full controls, and scrolling by
 * hand (which turns Follow off) brings them back too.
 */
export function PlayerBar() {
  const part = useAudio((s) => s.part);
  const playing = useAudio((s) => s.playing);
  const time = useAudio((s) => Math.floor(s.time));
  const rate = useAudio((s) => s.rate);
  const follow = useAudio((s) => s.follow);
  const expanded = useAudio((s) => s.expanded);
  const c = useAudioControls();
  if (!part) return null;
  if (follow && !expanded) return <MiniPlayer />;

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
          {follow ? (
            <button
              type="button"
              className={button}
              onClick={() => c.setExpanded(false)}
              aria-label="Minimize the player"
            >
              <ChevronDown className="size-5" />
            </button>
          ) : null}
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

/** The slim bar Follow shows: play, the part, and how far through it. */
function MiniPlayer() {
  const part = useAudio((s) => s.part)!;
  const playing = useAudio((s) => s.playing);
  const time = useAudio((s) => Math.floor(s.time));
  const c = useAudioControls();
  const index = PARTS.findIndex((p) => p.id === part);
  const duration = partDuration(part);
  const progress = Math.min(1, time / duration);
  return (
    <div
      data-player-bar
      data-mini
      role="region"
      aria-label="Audio player, minimized"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-rule bg-ink/95 backdrop-blur-md"
    >
      <div
        className="absolute inset-x-0 top-0 h-0.5 origin-left bg-brass transition-transform duration-500"
        style={{ transform: `scaleX(${progress})` }}
        aria-hidden
      />
      <div className="mx-auto flex max-w-4xl items-center gap-2 px-3 pt-1 pb-[max(0.25rem,env(safe-area-inset-bottom))] sm:px-6">
        <button
          type="button"
          onClick={c.toggle}
          aria-label={playing ? "Pause" : "Play"}
          className="flex size-11 shrink-0 items-center justify-center rounded-full bg-brass text-ink hover:bg-paper"
        >
          {playing ? <Pause className="size-4" /> : <Play className="size-4 translate-x-px" />}
        </button>
        <button
          type="button"
          onClick={() => c.setExpanded(true)}
          className="flex min-h-11 min-w-0 flex-1 flex-col justify-center text-left"
          aria-label="Show the player controls"
        >
          <span className="truncate font-sans text-[0.66rem] tracking-[0.14em] text-brass uppercase">
            <span className="text-muted">
              {index + 1}/{PARTS.length}
            </span>{" "}
            {PARTS[index].title}
          </span>
          <span className="font-sans text-[0.68rem] text-fog tabular-nums">
            {formatClock(time)} / {formatClock(duration)} · Following
          </span>
        </button>
        <button
          type="button"
          onClick={() => c.setExpanded(true)}
          aria-label="Show the player controls"
          className="flex size-11 shrink-0 items-center justify-center text-paper hover:text-brass"
        >
          <ChevronUp className="size-5" />
        </button>
      </div>
    </div>
  );
}

/** Keeps the page's end clear of the docked player, at whichever size it is. */
export function PlayerSpacer() {
  const part = useAudio((s) => s.part);
  const mini = useAudio((s) => s.follow && !s.expanded);
  if (!part) return null;
  return <div aria-hidden className={mini ? "h-16 shrink-0" : "h-40 shrink-0"} />;
}
