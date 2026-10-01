import { useRef, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ImageOff, ZoomIn } from "lucide-react";
import type { Plate as PlateData } from "@/data/article";
import { plateImages, type PlateImage } from "@/data/plateImages";
import { fadeIn } from "@/lib/fadeIn";
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
  reading = false,
}: {
  plate: PlateData;
  tone?: "paper" | "ink";
  link?: boolean;
  large?: boolean;
  /** Its caption is being read aloud right now. */
  reading?: boolean;
}) {
  const image = plateImages[plate.id];
  const onPaper = tone === "paper";
  const alt = plate.caption.replace(/\*+/g, "");
  const frame = image?.set ? (
    <PlateSet set={image.set} alt={alt} large={large} />
  ) : image ? (
    <img
      src={image.src}
      alt={alt}
      width={image.width}
      height={image.height}
      loading="lazy"
      decoding="async"
      ref={fadeIn}
      // The box is sized before the image arrives (the width it will have,
      // the height from its aspect ratio), so loading a plate never pushes
      // the text below it down: links and the read-along land where they aim.
      className="mx-auto block h-auto max-w-full"
      style={{
        width: `min(100%, calc(${large ? "75vh" : "28rem"} * ${image.width} / ${image.height}))`,
        aspectRatio: `${image.width} / ${image.height}`,
      }}
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
    <figure
      id={plate.id}
      data-block={plate.id}
      className={cn(
        "scroll-mt-24 transition-shadow duration-300",
        reading && "shadow-[0_0_0_3px_var(--color-brass),0_0_28px_rgb(255_90_108_/_0.45)]",
      )}
    >
      {link ? (
        <Link
          to="/archive/$id"
          params={{ id: plate.id }}
          className="block"
          aria-label={`Plate ${plate.number}`}
        >
          {frame}
        </Link>
      ) : image ? (
        <PlateZoom plate={plate} images={image.set ?? [image]}>
          {frame}
        </PlateZoom>
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

/**
 * Tap to see the plate at full size in a scrollable full-screen view, for
 * reading the small print of a clipping. Ported from spirit-of-martinez's
 * PhotoPlate zoom.
 */
function PlateZoom({
  plate,
  images,
  children,
}: {
  plate: PlateData;
  /** One image, or every photograph of a plate made of several. */
  images: PlateImage[];
  children: ReactNode;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const label = `Plate ${plate.number}`;
  return (
    <>
      <button
        type="button"
        onClick={() => dialog.current?.showModal()}
        aria-label={`Zoom. ${label}.`}
        className="group relative block w-full cursor-zoom-in"
      >
        {children}
        <span className="absolute right-2 bottom-2 flex items-center gap-1.5 bg-ink/85 px-2.5 py-1.5 font-sans text-[0.66rem] tracking-[0.14em] text-paper uppercase group-hover:text-brass">
          <ZoomIn className="size-3.5" aria-hidden />
          Zoom
        </span>
      </button>
      <dialog
        ref={dialog}
        aria-label={label}
        className="plate-zoom m-0 h-full max-h-none w-full max-w-none bg-ink p-0 text-paper open:flex open:flex-col [&::backdrop]:bg-ink/95"
      >
        <form
          method="dialog"
          className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-rule bg-ink/90 px-4 py-2"
        >
          <p className="truncate font-sans text-[0.68rem] tracking-[0.16em] text-brass uppercase">
            {label}
          </p>
          <button
            type="submit"
            className="inline-flex min-h-11 items-center text-[0.68rem] tracking-[0.16em] text-paper uppercase hover:text-brass"
          >
            Close
          </button>
        </form>
        <div className="min-h-0 flex-1 space-y-6 overflow-auto pb-6">
          {images.map(({ src, width, height }, i) => (
            <figure key={src}>
              <img
                src={src}
                alt={
                  images.length > 1
                    ? `${plate.caption.replace(/\*+/g, "")} Photograph ${i + 1} of ${images.length}.`
                    : plate.caption.replace(/\*+/g, "")
                }
                width={width}
                height={height}
                className="mx-auto block h-auto max-w-none"
                style={{ width: `max(100%, ${Math.min(width, 1800)}px)` }}
              />
              {images.length > 1 ? (
                <figcaption className="mt-2 px-4 font-sans text-[0.68rem] tracking-[0.16em] text-muted uppercase">
                  {i + 1} of {images.length}
                </figcaption>
              ) : null}
            </figure>
          ))}
        </div>
      </dialog>
    </>
  );
}

/** Two across the top, threes below, for a span of 1 to 3 per row. */
const SET_LEAD = ["", "col-span-6 aspect-[2/1]", "col-span-3 aspect-[3/2]"];

/**
 * A plate the post builds from several photographs, all of them at once:
 * the odd one or two across the top, the rest three to a row. Each is
 * cropped to its cell here; the zoom view shows every one whole.
 */
function PlateSet({ set, alt, large }: { set: PlateImage[]; alt: string; large: boolean }) {
  const lead = set.length % 3;
  return (
    <div
      className="mx-auto grid grid-cols-6 gap-1"
      style={{ width: `min(100%, ${large ? "44rem" : "28rem"})` }}
    >
      {set.map((image, i) => (
        <img
          key={image.src}
          src={image.src}
          alt={`${alt} Photograph ${i + 1} of ${set.length}.`}
          width={image.width}
          height={image.height}
          loading="lazy"
          decoding="async"
          ref={fadeIn}
          className={cn(
            "block size-full object-cover",
            i < lead ? SET_LEAD[lead] : "col-span-2 aspect-[4/3]",
          )}
        />
      ))}
    </div>
  );
}
