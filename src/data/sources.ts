import { chapters, plates, type Plate } from "./article.ts";
import FROZEN from "../model/frozen.json" with { type: "json" };

/**
 * The record behind the post, drawn from the post: the newspapers its plates
 * reproduce, the records it names in the text, and its own thanks.
 */

/** Publications as the plate captions name them. A caption belongs to the first that it starts with. */
export const PUBLICATIONS = [
  "The Sheridan Press",
  "Casper Star-Tribune",
  "Martinez Daily Standard",
  "Martinez News-Gazette",
  "Daily News, Los Angeles",
  "The Billings Gazette",
  "The Tahoe Tribune",
] as const;

export function platesByPublication(): { name: string; plates: Plate[] }[] {
  const groups = PUBLICATIONS.map((name) => ({
    name: name as string,
    plates: plates.filter((p) => p.caption.startsWith(name)),
  }));
  const claimed = new Set(groups.flatMap((g) => g.plates.map((p) => p.id)));
  return [
    ...groups.filter((g) => g.plates.length),
    { name: "Records, photographs and ephemera", plates: plates.filter((p) => !claimed.has(p.id)) },
  ];
}

/**
 * Sources the post names in its text but does not reproduce. `quote` is the
 * post's own sentence (or the part of it that names the source), verbatim;
 * it is also the door back to the paragraph. `id` is frozen; a record the
 * text cites points at it. One file per source in sources/, edited through
 * the CMS, listed in the order they were frozen.
 */
export type NamedSource = {
  id: string;
  name: string;
  quote: string;
  /** Where it can be read, if anywhere; `accessed` is required with it. */
  url?: string;
  accessed?: string;
};
/** The source files, keyed by path ("./sources/census-1920.json"), for the file-name check. */
export const sourceFiles = import.meta.glob("./sources/*.json", {
  eager: true,
  import: "default",
}) as Record<string, NamedSource>;

const rank = new Map(FROZEN.sources.map((id, i) => [id, i]));
export const namedInText: NamedSource[] = Object.values(sourceFiles).sort(
  (a, b) => (rank.get(a.id) ?? Infinity) - (rank.get(b.id) ?? Infinity) || a.id.localeCompare(b.id),
);

/** The post's closing thanks, one entry per line, verbatim. */
export const thanks: string[] = (() => {
  const last = chapters[chapters.length - 1];
  const start = last.blocks.findIndex((b) => b.type === "p" && b.text.startsWith("Thanks to: "));
  return last.blocks
    .slice(start)
    .flatMap((b) => (b.type === "p" ? [b.text.replace(/^Thanks to: /, "")] : []));
})();
