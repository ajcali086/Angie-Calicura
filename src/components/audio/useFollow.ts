import { useEffect, useRef } from "react";
import { useNavigate } from "@tanstack/react-router";
import { blockChapter } from "@/data/audio";
import { useAudio, useAudioControls } from "./AudioProvider";

/**
 * Read-along for a chapter page: which paragraph (or plate caption) is being
 * read, and, while Follow is on, keep it in view and turn to the next chapter
 * when the narration crosses into it. The page moves once per paragraph, not
 * per sentence: paragraph boundaries are where the timing is surest, and a
 * page that jumps less is easier to read along with. Scrolling by hand turns
 * Follow off (the player's Follow button turns it back on), as on
 * spirit-of-martinez.
 */
export function useFollow(slug: string): string | null {
  const block = useAudio((s) => (s.part && s.time > 0 ? (s.cue?.block ?? null) : null));
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
    if (!block || !playing || !follow) return;
    const chapter = blockChapter(block);
    if (chapter && chapter !== slug) {
      ignoreUntil.current = Date.now() + 1500;
      void navigate({ to: "/chapters/$slug", params: { slug: chapter }, hash: block });
      return;
    }
    const el = document.querySelector<HTMLElement>(`[data-block="${block}"]`);
    if (!el) return;
    const r = el.getBoundingClientRect();
    const player = document.querySelector("[data-player-bar]")?.getBoundingClientRect().top;
    const top = 80;
    const bottom = (player ?? window.innerHeight) - 16;
    const room = bottom - top;
    const fits = r.height <= room;
    // A paragraph that fits stays put while all of it shows; one taller than
    // the space is read from its start, so it stays put only with its top
    // near the top.
    if (fits ? r.top >= top && r.bottom <= bottom : r.top >= top && r.top <= top + 48) return;
    ignoreUntil.current = Date.now() + 900;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const y = window.scrollY + r.top - top - (fits ? (room - r.height) / 3 : 0);
    window.scrollTo({ top: y, behavior: reduce ? "auto" : "smooth" });
  }, [block, playing, follow, slug, navigate]);

  return block;
}
