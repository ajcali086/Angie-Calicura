import { useEffect, useRef, useState } from "react";
import { renderSnippetCard } from "@/lib/snippetCard";

/**
 * A shareable "story" image for one moment — a plate, a rule, a kicker, the
 * passage itself, and a quiet footer (see snippetCard.ts for the draw order).
 * Shares a single PNG via the Web Share API, downloading it where file
 * sharing isn't supported. Ported from spirit-of-martinez; shown on each
 * plate page with the passage the plate sits beside.
 */
export type SnippetCardProps = {
  /** e.g. "Part 2 · Wyoming Madame", title case — the card uppercases and
   * tracks it itself. */
  kicker: string;
  /** One or more already-resolved sentence strings, in order. Not raw
   * paragraph text — see fitCardText() in snippetCard.ts for why. */
  sentences: string[];
  /** A credit line, verbatim, or null. */
  credit?: string | null;
  /** The plate's image path, with its extension. */
  plateSrc: string;
  plateAlt: string;
  /** Widens the image band so a portrait crop doesn't cut through a face. */
  plateIsPortrait?: boolean;
  /** Reuse an already-decoded, on-page <img> instead of loading a second
   * copy — pass this whenever the plate is already rendered elsewhere on
   * the page (renderSnippetCard() never fetches on its own). */
  plateImageEl?: HTMLImageElement | null;
  shareTitle: string;
  shareText: string;
  shareUrl: string;
  className?: string;
};

type State = "idle" | "rendering" | "ready" | "error";

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Could not load ${src}`));
    img.decoding = "async";
    img.src = src;
  });
}

const loadPlateImage = loadImage;

export function SnippetCard({
  kicker,
  sentences,
  credit = null,
  plateSrc,
  plateAlt,
  plateIsPortrait = false,
  plateImageEl = null,
  shareTitle,
  shareText,
  shareUrl,
  className,
}: SnippetCardProps) {
  const rowRef = useRef<HTMLDivElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [visible, setVisible] = useState(false);
  const [state, setState] = useState<State>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);

  // Lazy: don't build a 1080×1350 canvas until the row is actually on
  // screen — a chapter page can have dozens of these.
  useEffect(() => {
    const el = rowRef.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!visible || state !== "idle") return;
    let cancelled = false;
    setState("rendering");
    void (async () => {
      try {
        const plateImage = plateImageEl ?? (await loadPlateImage(plateSrc));
        const canvas = await renderSnippetCard({
          plateImage,
          plateIsPortrait,
          credit,
          kicker,
          sentences,
        });
        if (cancelled) return;
        // The rendered canvas becomes the visible element directly — no
        // second canvas, no pixel copy, nothing that can drift from what
        // gets shared.
        canvasRef.current = canvas;
        canvas.className = "block h-auto w-full";
        hostRef.current?.replaceChildren(canvas);
        setState("ready");
      } catch (err) {
        if (cancelled) return;
        canvasRef.current = null;
        setErrorMessage(
          err instanceof Error ? err.message : "Could not build a card for this passage.",
        );
        setState("error");
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sentences are stable per moment; re-keying the component (not re-rendering it) is how a caller should change what's shown.
  }, [visible, state]);

  async function onShare() {
    const canvas = canvasRef.current;
    if (!canvas || state !== "ready" || sharing) return;
    setSharing(true);
    try {
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
      if (!blob) return;
      const file = new File([blob], "moment.png", { type: "image/png" });
      const nav = navigator as Navigator & {
        canShare?: (data: { files?: File[] }) => boolean;
      };
      if (nav.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: shareTitle,
          text: shareText,
          url: new URL(shareUrl, location.href).href,
        });
        return;
      }
      // Most desktop browsers can't share a file yet, and a Blob doesn't
      // reliably reach the clipboard across browsers the way CopyLink's
      // text does — so the fallback is a plain download.
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "moment.png";
      a.click();
      URL.revokeObjectURL(a.href);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setErrorMessage("Could not share this image. Try again?");
    } finally {
      setSharing(false);
    }
  }

  if (state === "error") {
    return <p className="my-6 font-sans text-[0.68rem] text-muted">{errorMessage}</p>;
  }

  return (
    <div ref={rowRef} className={className ?? "my-6 max-w-xs"}>
      <button
        type="button"
        onClick={() => void onShare()}
        disabled={state !== "ready" || sharing}
        aria-label={`Share this passage as an image: ${sentences.join(" ")} Pictured: ${plateAlt}.`}
        className="block w-full overflow-hidden rounded-sm border border-rule bg-ink-mid text-left disabled:opacity-70"
      >
        <div
          ref={hostRef}
          className="bg-ink-mid"
          style={{ aspectRatio: "1080 / 1350" }}
          aria-hidden="true"
        />
        <span className="flex items-center justify-between px-3 py-2 font-sans text-[0.68rem] tracking-[0.16em] text-brass uppercase hover:text-paper">
          {sharing ? "Preparing…" : state === "ready" ? "Share as image" : "Loading card…"}
        </span>
      </button>
    </div>
  );
}
