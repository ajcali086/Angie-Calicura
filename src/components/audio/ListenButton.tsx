import { Headphones } from "lucide-react";
import { blockWindow, formatClock } from "@/data/audio";
import { cn } from "@/lib/utils";
import { useAudioControls } from "./AudioProvider";

/** Plays the narration from the start of a block. Renders nothing for a block the audio doesn't read. */
export function ListenButton({
  block,
  label = "Listen",
  length,
  className,
}: {
  block: string | undefined;
  label?: string;
  /** Seconds to show beside the label, e.g. a chapter's running time. */
  length?: number;
  className?: string;
}) {
  const { playBlock } = useAudioControls();
  const w = block ? blockWindow(block) : null;
  if (!block || !w) return null;
  return (
    <button
      type="button"
      onClick={() => playBlock(block)}
      className={cn(
        "inline-flex min-h-11 items-center gap-1.5 text-[0.7rem] tracking-[0.14em] text-brass uppercase hover:text-paper",
        className,
      )}
    >
      <Headphones className="size-3.5" aria-hidden />
      {label}
      {length ? <span className="text-muted">· {formatClock(length)}</span> : null}
    </button>
  );
}
