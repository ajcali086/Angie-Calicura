import { Headphones } from "lucide-react";
import { NARRATION, PARTS, formatClock, totalDuration } from "@/data/audio";
import { useAudioControls } from "./AudioProvider";

/** The home page's way in: the whole article, read aloud, from the top. */
export function ListenArticle() {
  const { play } = useAudioControls();
  return (
    <button
      type="button"
      onClick={() => play(PARTS[0].id, 0)}
      className="group mt-10 flex min-h-16 w-full items-center gap-4 border border-rule bg-ink-soft/60 px-5 py-3 text-left hover:border-brass"
    >
      <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-brass text-ink group-hover:bg-paper">
        <Headphones className="size-5" aria-hidden />
      </span>
      <span>
        <span className="kicker block">Listen to the article</span>
        <span className="mt-1 block text-sm text-fog">
          Read aloud in {PARTS.length} parts · {formatClock(totalDuration)}
        </span>
        <span className="mt-1 block text-xs text-muted">{NARRATION.note}</span>
      </span>
    </button>
  );
}
