import { Link } from "@tanstack/react-router";
import { ImageOff } from "lucide-react";
import type { Plate as PlateData } from "@/data/article";
import { plateImages } from "@/data/plateImages";
import { cn } from "@/lib/utils";
import { Inline } from "./Inline";

/**
 * One of the post's images with its caption as the post gives it. A plate
 * whose image hasn't been added yet still shows its caption, in a frame that
 * says so, rather than disappearing from the record.
 */
export function Plate({
  plate,
  tone = "paper",
  link = true,
  large = false,
}: {
  plate: PlateData;
  tone?: "paper" | "ink";
  link?: boolean;
  large?: boolean;
}) {
  const image = plateImages[plate.id];
  const onPaper = tone === "paper";
  const frame = image ? (
    <img
      src={image.src}
      alt={plate.caption.replace(/\*+/g, "")}
      width={image.width}
      height={image.height}
      loading="lazy"
      decoding="async"
      className={cn("mx-auto h-auto w-auto max-w-full", large ? "max-h-[75vh]" : "max-h-[28rem]")}
    />
  ) : (
    <div
      className={cn(
        "flex min-h-32 flex-col items-center justify-center gap-2 border border-dashed px-4 py-6 text-center",
        onPaper ? "border-brass-dim/50 text-brass-dim" : "border-rule text-muted",
      )}
    >
      <ImageOff className="size-5" aria-hidden />
      <span className="font-sans text-[0.68rem] tracking-[0.16em] uppercase">
        Image not yet added
      </span>
    </div>
  );

  return (
    <figure id={plate.id} className="scroll-mt-24">
      {link ? (
        <Link
          to="/archive/$id"
          params={{ id: plate.id }}
          className="block"
          aria-label={`Plate ${plate.number}`}
        >
          {frame}
        </Link>
      ) : (
        frame
      )}
      <figcaption
        className={cn(
          "mt-3 font-sans text-[0.8rem] leading-relaxed",
          onPaper ? "text-ink-soft/80" : "text-fog",
        )}
      >
        <span
          className={cn(
            "mr-2 tracking-[0.14em] uppercase",
            onPaper ? "text-brass-dim" : "text-brass",
          )}
        >
          Plate {plate.number}
        </span>
        <Inline text={plate.caption} />
      </figcaption>
    </figure>
  );
}
