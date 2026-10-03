import { useEffect } from "react";
import { claimMotion, reducedMotion } from "./motionBudget";

/**
 * Fades each `[data-reveal]` element in, with a 12px rise, the first time it
 * scrolls into view (styles.css). Elements already on screen when the page
 * opens are left as they are, so nothing animates on arrival, and nothing is
 * hidden at all under prefers-reduced-motion or before this has run. At most
 * two fades run at once (motionBudget); the rest appear without one.
 *
 * `key` re-scans when the page's content changes (another chapter).
 */
export function useReveal(key: string) {
  useEffect(() => {
    if (reducedMotion()) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          const el = e.target as HTMLElement;
          io.unobserve(el);
          // No free slot (a fast scroll, a long jump): show it at once.
          el.dataset.revealState = claimMotion(500) ? "shown" : "instant";
        }
      },
      { rootMargin: "0px 0px -6% 0px" },
    );
    for (const el of document.querySelectorAll<HTMLElement>("[data-reveal]")) {
      if (el.dataset.revealState) continue;
      const r = el.getBoundingClientRect();
      if (r.top < innerHeight && r.bottom > 0) continue;
      el.dataset.revealState = "pending";
      io.observe(el);
    }
    return () => {
      io.disconnect();
      // Clear every mark: nothing stays hidden, and the next chapter (which
      // reuses these elements) is scanned afresh.
      for (const el of document.querySelectorAll<HTMLElement>("[data-reveal-state]"))
        delete el.dataset.revealState;
    };
  }, [key]);
}
