import { useEffect, useRef } from "react";
import { useNavigate } from "@tanstack/react-router";
import { blockChapter } from "@/data/audio";
import { useAudio, useAudioControls } from "./AudioProvider";

/**
 * Read-along for a chapter page: which sentence and block are being spoken,
 * and, while Follow is on, keep that sentence in view and turn to the next
 * chapter when the narration crosses into it. Scrolling by hand turns Follow
 * off (the player's Follow button turns it back on), as on spirit-of-martinez.
 */
export function useFollow(slug: string) {
  const cue = useAudio((s) => (s.part && s.time > 0 ? s.cue : null));
  const playing = useAudio((s) => s.playing);
  const follow = useAudio((s) => s.follow);
  const { setFollow } = useAudioControls();
  const navigate = useNavigate();
  const ignoreUntil = useRef(0);

  // Hand scrolling hands control back to the reader.
  useEffect(() => {
    const keys = ["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End"];
    const off = (e: Event) => {
      if (Date.now() < ignoreUntil.current) return;
      if (e instanceof KeyboardEvent && !keys.includes(e.key)) return;
      setFollow(false);
    };
    window.addEventListener("wheel", off, { passive: true });
    window.addEventListener("touchmove", off, { passive: true });
    window.addEventListener("keydown", off);
    return () => {
      window.removeEventListener("wheel", off);
      window.removeEventListener("touchmove", off);
      window.removeEventListener("keydown", off);
    };
  }, [setFollow]);

  useEffect(() => {
    if (!cue || !playing || !follow) return;
    const chapter = blockChapter(cue.block);
    if (chapter && chapter !== slug) {
      ignoreUntil.current = Date.now() + 1500;
      void navigate({ to: "/chapters/$slug", params: { slug: chapter }, hash: cue.block });
      return;
    }
    const el =
      document.querySelector<HTMLElement>(`[data-cue="${cue.id}"]`) ??
      document.querySelector<HTMLElement>(`[data-block="${cue.block}"]`);
    if (!el) return;
    const r = el.getBoundingClientRect();
    const top = 80;
    const bottom = window.innerHeight - 180; // clear of the docked player
    if (r.top >= top && r.bottom <= bottom) return;
    ignoreUntil.current = Date.now() + 900;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ block: "center", behavior: reduce ? "auto" : "smooth" });
  }, [cue, playing, follow, slug, navigate]);

  return { cueId: cue?.id ?? null, block: cue?.block ?? null };
}
