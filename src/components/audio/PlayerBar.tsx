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
import { useEffect, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { NARRATION, PARTS, formatClock, partDuration, readingPlace } from "@/data/audio";
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
  useDockHeight(part ? (follow && !expanded ? "mini" : "full") : null);
  if (!part) return null;
  if (follow && !expanded) return <MiniPlayer />;

  const index = PARTS.findIndex((p) => p.id === part);
  const meta = PARTS[index];
  const duration = partDuration(part);
  const button =
    "flex size-11 shrink-0 items-center justify-center text-paper hover:text-brass disabled:opacity-35";
  // Under 375px the transport row is too wide at full size, so its buttons
  // narrow (keeping their 44px height) and the speed and Follow tighten.
  const transport = (narrow: "w-8" | "w-9") =>
    cn(
      "flex h-11 shrink-0 items-center justify-center text-paper hover:text-brass disabled:opacity-35 min-[375px]:w-11",
      narrow,
    );

  return (
    <div
      data-player-bar
      role="region"
      aria-label="Audio player"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-rule bg-ink/95 backdrop-blur-md"
    >
      <div className="mx-auto max-w-4xl px-3 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:px-6">
        <div className="flex items-center gap-2">
          <div className="flex min-h-11 min-w-0 flex-1 flex-col justify-center">
            <ReadingPlaceLink className="flex min-h-7 min-w-0 items-end">
              <span className="truncate font-sans text-[0.68rem] tracking-[0.14em] text-brass uppercase underline-offset-4 hover:underline">
                {playing ? <span className="ember mr-2 align-middle" aria-hidden /> : null}
                <span className="text-muted">
                  {index + 1}/{PARTS.length}
                </span>{" "}
                {meta.title}
              </span>
            </ReadingPlaceLink>
            <span title={NARRATION.note} className="truncate font-sans text-[0.68rem] text-fog">
              {NARRATION.label}
            </span>
          </div>
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
              className={transport("w-8")}
              onClick={() => c.step(-1)}
              disabled={index === 0}
              aria-label="Previous part"
            >
              <SkipBack className="size-5" />
            </button>
            <button
              type="button"
              className={transport("w-9")}
              onClick={() => c.skip(-15)}
              aria-label="Back 15 seconds"
            >
              <RotateCcw className="size-5" />
            </button>
            <button
              type="button"
              onClick={c.toggle}
              aria-label={playing ? "Pause" : "Play"}
              className="flex size-12 shrink-0 items-center justify-center rounded-full bg-brass text-ink hover:bg-paper min-[375px]:mx-1"
            >
              {playing ? <Pause className="size-5" /> : <Play className="size-5 translate-x-px" />}
            </button>
            <button
              type="button"
              className={transport("w-9")}
              onClick={() => c.skip(15)}
              aria-label="Forward 15 seconds"
            >
              <RotateCw className="size-5" />
            </button>
            <button
              type="button"
              className={transport("w-8")}
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
              className="flex min-h-11 min-w-9 items-center justify-center font-sans text-[0.78rem] min-[375px]:min-w-11 text-fog tabular-nums hover:text-paper"
            >
              {rate}×
            </button>
            <button
              type="button"
              onClick={() => c.setFollow(!follow)}
              aria-pressed={follow}
              className={cn(
                "flex min-h-11 items-center px-1 font-sans text-[0.68rem] tracking-[0.14em] uppercase min-[375px]:px-2",
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
        className="absolute inset-x-0 top-0 h-0.5 origin-left bg-brass"
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
        <ReadingPlaceLink className="flex min-h-11 min-w-0 flex-1 flex-col justify-center text-left">
          <span className="truncate font-sans text-[0.66rem] tracking-[0.14em] text-brass uppercase">
            {playing ? <span className="ember mr-2 align-middle" aria-hidden /> : null}
            <span className="text-muted">
              {index + 1}/{PARTS.length}
            </span>{" "}
            {PARTS[index].title}
          </span>
          <span className="font-sans text-[0.68rem] text-fog tabular-nums">
            {formatClock(time)} / {formatClock(duration)} · Following · {NARRATION.label}
          </span>
        </ReadingPlaceLink>
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

/**
 * The part's name is a way back to the text: it opens the chapter at the
 * paragraph being read now, and turns Follow on so the page stays with the
 * narration from there.
 */
function ReadingPlaceLink({ className, children }: { className: string; children: ReactNode }) {
  const part = useAudio((s) => s.part)!;
  const block = useAudio((s) => s.cue?.block ?? null);
  const { setFollow } = useAudioControls();
  const place = readingPlace(part, block ? { block } : null);
  if (!place) return <span className={className}>{children}</span>;
  return (
    <Link
      to="/chapters/$slug"
      params={{ slug: place.slug }}
      hash={place.hash}
      onClick={() => setFollow(true)}
      className={className}
      aria-label="Go to the passage being read"
    >
      {children}
    </Link>
  );
}

/** Publishes the player's height as --dock-h, so floating buttons sit above it. */
function useDockHeight(size: "mini" | "full" | null) {
  useEffect(() => {
    const root = document.documentElement;
    const bar = document.querySelector<HTMLElement>("[data-player-bar]");
    if (!size || !bar) {
      root.style.removeProperty("--dock-h");
      return;
    }
    const set = () => root.style.setProperty("--dock-h", `${bar.offsetHeight}px`);
    set();
    const ro = new ResizeObserver(set);
    ro.observe(bar);
    return () => ro.disconnect();
  }, [size]);
}

/** Keeps the page's end clear of the docked player, at whichever size it is. */
export function PlayerSpacer() {
  const part = useAudio((s) => s.part);
  const mini = useAudio((s) => s.follow && !s.expanded);
  if (!part) return null;
  return <div aria-hidden className={mini ? "h-16 shrink-0" : "h-40 shrink-0"} />;
}
