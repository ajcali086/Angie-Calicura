import { ARTICLE_SOURCE } from "./article.source.ts";
import FROZEN from "./frozen-ids.json" with { type: "json" };

/**
 * The article, parsed from the transcript and never retyped.
 *
 * source/article.md is Michael Dykhorst's post as extracted on 2026-09-29.
 * Every paragraph, quote, list and caption on the site is a slice of that
 * file. The only editorial choice made here is where the chapters break,
 * and the chapter titles are the three stations in the post's own
 * subtitle: "From Martinez Girlhood to Wyoming Madame to Tahoe Restaurateur".
 *
 * Inline emphasis stays in the post's own markdown (*italic*, **bold**) and
 * is rendered by components/Inline.tsx, so the stored text stays verbatim.
 *
 * Block and plate ids are frozen: src/data/frozen-ids.json pairs each id
 * with the opening words of its block (or caption), and a block takes the
 * id whose opening words it starts with. Share links, audio cues, timeline
 * and source links all hang on these ids, so inserting a paragraph must not
 * renumber the ones after it. A block with no frozen id gets a provisional
 * "unfrozen-" id until scripts/freeze-ids.ts gives it a new one. Never
 * renumber or reuse an id; retire it.
 */

export type Block =
  | { type: "p"; id: string; text: string }
  | { type: "quote"; id: string; text: string }
  | { type: "list"; id: string; items: string[] }
  | { type: "figure"; plate: string };

export type Chapter = {
  number: number;
  slug: string;
  title: string;
  blocks: Block[];
};

export type Plate = {
  /** "plate-01" …, frozen (see frozenIds). */
  id: string;
  /** Its place in the post's order of images, for "Plate 12" and prev/next. */
  number: number;
  caption: string;
  chapter: string;
  /** The paragraph the plate sits beside: the one before it, or the next one if it opens a chapter. */
  paragraph: string;
};

const lines = ARTICLE_SOURCE.split("\n");
const rules = lines.flatMap((line, i) => (line.trim() === "---" ? [i] : []));
if (rules.length < 2) throw new Error("article.md: expected a header rule and an end rule");

const header = lines.slice(0, rules[0]);
const field = (label: string) =>
  header
    .find((l) => l.startsWith(`**${label}:**`))
    ?.slice(label.length + 5)
    .trim() ?? "";

export const article = {
  title: header.find((l) => l.startsWith("# "))!.slice(2),
  subtitle: header.find((l) => l.startsWith("## "))!.slice(3),
  /** "Michael Dykhorst, sheridanwyominghistory.com" */
  source: field("Source"),
  url: field("URL"),
  author: field("Source").split(",")[0],
};

/** Where each chapter begins, matched against the start of a block in the transcript. */
export const CHAPTER_BREAKS = [
  { slug: "martinez-girlhood", title: "Martinez Girlhood", startsWith: "" },
  {
    slug: "wyoming-madame",
    title: "Wyoming Madame",
    startsWith: "[Image: Martinez News-Gazette, Martinez, California, Aug 07, 1951",
  },
  {
    slug: "tahoe-restaurateur",
    title: "Tahoe Restaurateur",
    startsWith: "The couple relocated to South Lake Tahoe",
  },
] as const;

/** Blank-line-separated groups of the body, between the two rules. */
const groups: string[][] = [];
for (const line of lines.slice(rules[0] + 1, rules[rules.length - 1])) {
  if (line.trim() === "") {
    if (groups.at(-1)?.length) groups.push([]);
    continue;
  }
  if (!groups.length) groups.push([]);
  groups.at(-1)!.push(line);
}
const body = groups.filter((g) => g.length);

const IMAGE = /^\[Image: (.*)\]$/;

/** Frozen ids as [id, opening words] pairs, in the order they were frozen. */
export type FrozenIds = {
  blocks: [string, string][];
  plates: [string, string][];
  retired: string[];
};
export const frozenIds = FROZEN as unknown as FrozenIds;

type Assigned = { kind: "blocks" | "plates"; id: string; chapter: number; text: string };
/** Every id handed out, with the transcript text it was matched on. */
export const assigned: Assigned[] = [];
/** Blocks and plates still waiting for a frozen id. */
export const unfrozen: Assigned[] = [];

function frozenId(kind: Assigned["kind"], text: string, chapter: number): string {
  const [hit] = frozenIds[kind]
    .filter(([, opening]) => text.startsWith(opening))
    .sort((a, b) => b[1].length - a[1].length);
  const entry = { kind, id: hit?.[0] ?? `unfrozen-${unfrozen.length + 1}`, chapter, text };
  if (!hit) unfrozen.push(entry);
  assigned.push(entry);
  return entry.id;
}

export const chapters: Chapter[] = [];
export const plates: Plate[] = [];

for (const group of body) {
  const first = group[0];
  const next = CHAPTER_BREAKS[chapters.length];
  if (next && (chapters.length === 0 || (next.startsWith && first.startsWith(next.startsWith)))) {
    chapters.push({ number: chapters.length + 1, slug: next.slug, title: next.title, blocks: [] });
  }
  const chapter = chapters.at(-1)!;
  const id = () => frozenId("blocks", group.join("\n"), chapter.number);

  if (group.every((l) => IMAGE.test(l))) {
    for (const line of group) {
      const caption = line.match(IMAGE)![1];
      const plate = frozenId("plates", caption, chapter.number);
      plates.push({
        id: plate,
        number: plates.length + 1,
        caption,
        chapter: chapter.slug,
        paragraph: "",
      });
      chapter.blocks.push({ type: "figure", plate });
    }
  } else if (group.every((l) => l.startsWith("> "))) {
    chapter.blocks.push({ type: "quote", id: id(), text: group.map((l) => l.slice(2)).join("\n") });
  } else if (group.every((l) => l.startsWith("- "))) {
    chapter.blocks.push({ type: "list", id: id(), items: group.map((l) => l.slice(2)) });
  } else {
    chapter.blocks.push({ type: "p", id: id(), text: group.join("\n") });
  }
}

// Each plate's door into the text: the block before it, else the one after.
for (const chapter of chapters) {
  chapter.blocks.forEach((block, i) => {
    if (block.type !== "figure") return;
    const before = chapter.blocks
      .slice(0, i)
      .reverse()
      .find((b) => b.type !== "figure");
    const after = chapter.blocks.slice(i + 1).find((b) => b.type !== "figure");
    const door = (before ?? after) as Exclude<Block, { type: "figure" }> | undefined;
    plates.find((p) => p.id === block.plate)!.paragraph = door?.id ?? "";
  });
}

export function chapterBySlug(slug: string) {
  return chapters.find((c) => c.slug === slug);
}

export function plateById(id: string) {
  return plates.find((p) => p.id === id);
}

/** Every anchorable block id in a chapter. */
export function anchorIds(chapter: Chapter): Set<string> {
  return new Set(chapter.blocks.flatMap((b) => (b.type === "figure" ? [] : [b.id])));
}

/** The raw text of a block, markdown markers and all. */
export function blockText(block: Block): string {
  if (block.type === "list") return block.items.join("\n");
  if (block.type === "figure") return plateById(block.plate)?.caption ?? "";
  return block.text;
}

/** Find the one block whose text contains `quote`. Used by the timeline, sources and register. */
export function locate(
  quote: string,
): { chapter: Chapter; block: Exclude<Block, { type: "figure" }> }[] {
  const found: { chapter: Chapter; block: Exclude<Block, { type: "figure" }> }[] = [];
  for (const chapter of chapters) {
    for (const block of chapter.blocks) {
      if (block.type !== "figure" && blockText(block).includes(quote))
        found.push({ chapter, block });
    }
  }
  return found;
}

/** Plain text with the markdown emphasis markers removed, for meta tags and alt text. */
export function plain(text: string): string {
  return text.replace(/\*+/g, "");
}

/** The chapter and paragraph a verbatim quote lives in, for a "Read the passage" link. */
export function door(quote: string): { slug: string; hash: string } | undefined {
  const [hit] = locate(quote.replace(/^…/, "").replace(/…$/, ""));
  return hit && { slug: hit.chapter.slug, hash: hit.block.id };
}
