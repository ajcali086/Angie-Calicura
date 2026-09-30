/**
 * The narration script (source/narration-script.md) matched to the site's
 * spoken blocks. The script is the article normalized for speech: numbers
 * written out, "Photograph." before each caption, abbreviations expanded
 * ("Mrs." → "Missus"), emphasis removed. Two rules make its 170 blocks line
 * up one to one with the site's 172:
 *   - a list is read item by item, one script block per item;
 *   - the closing thanks (nine lines on the site) is read as one block.
 * Used by scripts/align-audio.ts to time the audio by what was actually
 * said, and by narration.test.ts to hold the match.
 */
import { readFileSync } from "node:fs";
import { chapters } from "../../src/data/article.ts";
import { spokenBlocks } from "../../src/data/audio.ts";
import { splitSentences, spoken } from "../../src/lib/sentences.ts";

export function scriptBlocks(): string[] {
  return readFileSync(new URL("../../source/narration-script.md", import.meta.url), "utf8")
    .split(/\n\s*\n/)
    .map((s) => s.trim())
    .filter((s) => s && s !== "[pause]");
}

/** The site's spoken blocks as the script groups them, each with the script text that reads it. */
export function matchScript(): { blocks: string[]; site: string; script: string }[] {
  const script = scriptBlocks();
  const lists = new Map(
    chapters.flatMap((c) =>
      c.blocks.flatMap((b) => (b.type === "list" ? [[b.id, b.items] as const] : [])),
    ),
  );
  const units: { blocks: string[]; site: string }[] = [];
  let thanks: { blocks: string[]; site: string } | null = null;
  for (const b of spokenBlocks()) {
    const items = lists.get(b.id);
    if (items) {
      items.forEach((it) => units.push({ blocks: [b.id], site: spoken(it) }));
      continue;
    }
    const text = spoken(b.raw);
    if (thanks) {
      thanks.blocks.push(b.id);
      thanks.site += ` ${text}`;
      continue;
    }
    if (text.startsWith("Thanks to:")) {
      thanks = { blocks: [b.id], site: text };
      units.push(thanks);
      continue;
    }
    units.push({ blocks: [b.id], site: text });
  }
  if (units.length !== script.length) {
    throw new Error(
      `narration script has ${script.length} blocks; the site groups into ${units.length}`,
    );
  }
  return units.map((u, i) => ({ ...u, script: script[i] }));
}

/** Word overlap between a site block and its script block, ignoring numbers (which the script spells out). */
export function similarity(a: string, b: string): number {
  const words = (t: string) =>
    new Set(
      t
        .toLowerCase()
        .replace(/^photograph\.\s*/, "")
        .replace(/[^a-z\s]/g, " ")
        .split(/\s+/)
        .filter((w) => w.length > 3),
    );
  const A = words(a);
  const B = words(b);
  let n = 0;
  for (const w of A) if (B.has(w)) n++;
  return n / Math.max(1, Math.max(A.size, B.size));
}

/**
 * How many characters the narrator speaks for each sentence of a site block.
 * When the script block splits into the same number of sentences, each gets
 * its own spoken length; otherwise the block's spoken length is shared out in
 * proportion to the site sentences.
 */
export function spokenLengths(): Map<string, number[]> {
  const out = new Map<string, number[]>();
  const perBlock = new Map<string, string[]>();
  for (const u of matchScript()) {
    if (u.blocks.length === 1) {
      perBlock.set(u.blocks[0], [...(perBlock.get(u.blocks[0]) ?? []), u.script]);
    } else {
      // the merged thanks: share the script text out by site length
      const sites = u.blocks.map((id) => spoken(spokenBlocks().find((b) => b.id === id)!.raw));
      const total = sites.reduce((t, s) => t + s.length, 0);
      u.blocks.forEach((id, k) =>
        perBlock.set(id, [
          `${"x".repeat(Math.round((sites[k].length / total) * u.script.length))}`,
        ]),
      );
    }
  }
  for (const b of spokenBlocks()) {
    const siteSentences = splitSentences(spoken(b.raw));
    const scripts = perBlock.get(b.id) ?? [];
    // a list's items are its sentences, one script block each
    const scriptSentences = scripts.length > 1 ? scripts : splitSentences(scripts[0] ?? "");
    if (scriptSentences.length === siteSentences.length) {
      out.set(
        b.id,
        scriptSentences.map((s) => s.length + 1),
      );
    } else {
      const total = scriptSentences.join(" ").length;
      const siteTotal = siteSentences.join(" ").length;
      out.set(
        b.id,
        siteSentences.map((s) => ((s.length + 1) / siteTotal) * total),
      );
    }
  }
  return out;
}
