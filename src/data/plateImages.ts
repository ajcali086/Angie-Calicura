import SIZES from "../generated/image-sizes.json" with { type: "json" };

/**
 * The plates whose images have been added: one file per plate in
 * src/data/plates/, edited through the CMS. Each lists its images in the
 * post's order, with alt text (required) and, for a print shown front and
 * back, which side. Width and height are measured from the files by
 * scripts/measure-images.mjs, so nobody types them.
 *
 * A plate the post builds from several photographs carries them all in
 * `set`, in the post's order; `src` is the first of them, for share cards.
 *
 * Missing: plate 33 was in the fourth zip, which was cut off in upload. It
 * shows its caption without an image until a file for it is added here.
 */
export type PlateImage = {
  src: string;
  width: number;
  height: number;
  /** What the image shows, for a reader who can't see it. */
  alt: string;
  side?: "front" | "back";
  /** A caption for this image alone, beside the plate's own. */
  caption?: string;
};

export type PlateFile = {
  id: string;
  images: { src: string; alt: string; side?: "front" | "back"; caption?: string }[];
  /** Whether the curator has reviewed the alt text, or it is still a draft. */
  alt_status: "draft" | "reviewed";
  /** The curator's, never shown to readers. */
  curator_note?: string;
};

/** The plate files, keyed by path ("./plates/plate-01.json"), for the file-name check. */
export const plateFiles = import.meta.glob("./plates/*.json", {
  eager: true,
  import: "default",
}) as Record<string, PlateFile>;

const sizes = SIZES as unknown as Record<string, [number, number]>;

function measured(image: PlateFile["images"][number]): PlateImage {
  const [width, height] = sizes[image.src] ?? [0, 0];
  return { ...image, width, height };
}

export const plateImages: Record<string, PlateImage & { set?: PlateImage[] }> = Object.fromEntries(
  Object.values(plateFiles)
    .filter((p) => p.images.length)
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((p) => {
      const images = p.images.map(measured);
      return [p.id, images.length > 1 ? { ...images[0], set: images } : images[0]];
    }),
);
