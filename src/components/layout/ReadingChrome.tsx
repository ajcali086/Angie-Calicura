import { useEffect, useRef, useState } from "react";
import { ArrowUp } from "lucide-react";

/** Keyboard users skip the header straight to the page. From spirit-of-martinez. */
export function SkipLink() {
  return (
    <a
      href="#main"
      className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[60] focus:bg-brass focus:px-4 focus:py-3 focus:text-sm focus:tracking-[0.14em] focus:text-ink focus:uppercase"
    >
      Skip to content
    </a>
  );
}

/**
 * The scroll meter: a hairline across the top of the page that fills as you
 * read down it, as on spirit-of-martinez, in the red-light neon. Updated at
 * most once a frame and drawn with a transform, so it never costs a layout.
 */
export function ReadingProgress() {
  const bar = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let frame = 0;
    const draw = () => {
      frame = 0;
      const el = document.documentElement;
      const max = el.scrollHeight - el.clientHeight;
      const p = max > 0 ? Math.min(1, Math.max(0, el.scrollTop / max)) : 0;
      if (bar.current) bar.current.style.transform = `scaleX(${p})`;
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(draw);
    };
    draw();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    // Pages grow after load (images), which moves the end of the page.
    const grow = new ResizeObserver(schedule);
    grow.observe(document.body);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      grow.disconnect();
    };
  }, []);

  return (
    <div
      data-reading-progress
      className="pointer-events-none fixed inset-x-0 top-0 z-50 h-[3px] bg-rule/50"
      aria-hidden
    >
      <div
        ref={bar}
        className="h-full origin-left bg-brass shadow-[0_0_8px_rgb(255_90_108_/_0.8)]"
        style={{ transform: "scaleX(0)" }}
      />
    </div>
  );
}

/** Shown once the reader is well down the page, hidden while the footer's links are in view. */
function useFloatingClearance() {
  const [scrolled, setScrolled] = useState(false);
  const [footerInView, setFooterInView] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 720);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    const footer = document.getElementById("site-footer");
    const io = footer
      ? new IntersectionObserver(([entry]) => setFooterInView(entry.isIntersecting), {
          threshold: 0.05,
        })
      : null;
    if (footer && io) io.observe(footer);
    return () => {
      window.removeEventListener("scroll", onScroll);
      io?.disconnect();
    };
  }, []);

  return scrolled && !footerInView;
}

/**
 * Back to top, as on spirit-of-martinez. It sits above the docked player at
 * whichever size it is (the player publishes its height as --dock-h).
 */
export function BackToTop() {
  const visible = useFloatingClearance();
  if (!visible) return null;
  return (
    <button
      type="button"
      onClick={() => {
        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
      }}
      className="fixed right-4 bottom-[calc(1rem+var(--dock-h,0px))] z-40 flex min-h-11 items-center gap-1.5 bg-brass px-4 font-sans text-[0.68rem] tracking-[0.16em] text-ink uppercase shadow-[0_0_14px_rgb(255_90_108_/_0.45)] hover:bg-paper sm:right-6 sm:bottom-[calc(1.5rem+var(--dock-h,0px))]"
      aria-label="Back to top"
    >
      <ArrowUp className="size-3.5" aria-hidden />
      Top
    </button>
  );
}
