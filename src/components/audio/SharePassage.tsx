import { useState } from "react";
import { Share2 } from "lucide-react";
import { plateById } from "@/data/article";
import { PARTS, blockSentences, blockWindow, formatClock, spokenBlocks } from "@/data/audio";
import { plateImages } from "@/data/plateImages";
import { loadAudioBuffer } from "@/lib/audioBlob";
import { slicePassageWav } from "@/lib/clipSlice";
import { renderSnippetCard } from "@/lib/snippetCard";

/**
 * "Share this moment": the passage as a link card. Sends, where the device
 * can take files, the card image (the plate, the passage, a Listen badge) and
 * a WAV clip of the passage read aloud, with a link that opens the page ready
 * to play from here. Falls back to sharing or copying the link alone.
 * Ported from spirit-of-martinez's SharePassage.
 */
async function tryShare(data: { title: string; text: string; url: string; files: File[] }) {
  const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
  if (data.files.length && nav.canShare?.({ files: data.files })) {
    try {
      await navigator.share({
        title: data.title,
        text: `${data.text}\n\n${data.url}`,
        files: data.files,
      });
      return "shared";
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return "abort";
    }
  }
  if (typeof navigator.share === "function") {
    try {
      await navigator.share({ title: data.title, text: data.text, url: data.url });
      return "shared";
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return "abort";
    }
  }
  return "fallback";
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(src));
    img.src = src;
  });
}

export function SharePassage({
  block,
  slug,
  plate,
  kicker,
}: {
  block: string;
  slug: string;
  plate: string;
  kicker: string;
}) {
  const [state, setState] = useState<"idle" | "busy" | "copied" | "fail">("idle");
  const window_ = blockWindow(block);

  async function onShare() {
    if (state === "busy") return;
    setState("busy");
    const settle = (s: "idle" | "copied" | "fail") => {
      setState(s);
      if (s !== "idle") setTimeout(() => setState("idle"), 2000);
    };
    try {
      const spokenBlock = spokenBlocks().find((b) => b.id === block)!;
      const sentences = blockSentences(spokenBlock);
      const url = `${location.origin}/chapters/${slug}?listen=1#${encodeURIComponent(block)}`;
      const listen = window_ ? `Listen · ${formatClock(window_.end - window_.start)}` : null;
      const files: File[] = [];

      const image = plateImages[plate];
      try {
        const canvas = await renderSnippetCard({
          plateImage: image ? await loadImage(image.src) : null,
          plateIsPortrait: image ? image.height > image.width : false,
          credit: plateById(plate) ? `Plate ${plateById(plate)!.number}` : null,
          kicker,
          sentences,
          listen,
        });
        const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.9));
        if (blob) files.push(new File([blob], "angie.jpg", { type: "image/jpeg" }));
      } catch {
        // Too long for a card, or no canvas: share without the image.
      }

      if (window_) {
        try {
          const src = PARTS.find((p) => p.id === window_.part)!.src;
          const ctx = new AudioContext();
          try {
            const wav = await slicePassageWav(
              await loadAudioBuffer(src),
              window_.start,
              window_.end + 0.3,
              ctx,
            );
            files.push(new File([wav], "angie-passage.wav", { type: "audio/wav" }));
          } finally {
            await ctx.close();
          }
        } catch {
          // No clip: the card and link still go.
        }
      }

      const text = `“${sentences[0]}”`;
      const result = await tryShare({ title: `${kicker} — Angie`, text, url, files });
      if (result !== "fallback") return settle("idle");
      await navigator.clipboard.writeText(url);
      settle("copied");
    } catch {
      settle("fail");
    }
  }

  const label =
    state === "busy"
      ? "Preparing"
      : state === "copied"
        ? "Link copied"
        : state === "fail"
          ? "Could not share"
          : "Share this moment";

  return (
    <button
      type="button"
      onClick={() => void onShare()}
      disabled={state === "busy"}
      aria-busy={state === "busy"}
      className="inline-flex min-h-11 items-center gap-1.5 font-sans text-[0.68rem] tracking-[0.16em] text-brass-dim uppercase hover:text-ink disabled:opacity-60"
    >
      <Share2 className="size-3.5" aria-hidden />
      {label}
    </button>
  );
}
