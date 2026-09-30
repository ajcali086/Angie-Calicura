import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { ARTICLE_SOURCE } from "./article.source.ts";
import { CHAPTER_BREAKS, anchorIds, article, chapters, plates, type Block } from "./article.ts";
import { plateImages } from "./plateImages.ts";

const raw = readFileSync(new URL("../../source/article.md", import.meta.url), "utf8");

/** A block written back out the way the transcript writes it. */
function markdown(block: Block): string {
  if (block.type === "quote")
    return block.text
      .split("\n")
      .map((l) => `> ${l}`)
      .join("\n");
  if (block.type === "list") return block.items.map((i) => `- ${i}`).join("\n");
  if (block.type === "figure")
    return `[Image: ${plates.find((p) => p.id === block.plate)!.caption}]`;
  return block.text;
}

describe("article", () => {
  it("embeds the transcript unchanged (run scripts/embed-article.mjs after editing it)", () => {
    assert.equal(ARTICLE_SOURCE, raw);
  });

  it("loses and alters nothing: the blocks write back out to the transcript body", () => {
    const lines = raw.split("\n");
    const rules = lines.flatMap((l, i) => (l.trim() === "---" ? [i] : []));
    const body = lines
      .slice(rules[0] + 1, rules[rules.length - 1])
      .join("\n")
      .split(/\n\s*\n/)
      .map((g) => g.trim())
      .filter(Boolean);
    // Consecutive image lines share a group in the transcript but are one plate each.
    const rebuilt: string[] = [];
    for (const block of chapters.flatMap((c) => c.blocks)) {
      const text = markdown(block);
      const prev = rebuilt.at(-1);
      if (block.type === "figure" && prev?.startsWith("[Image: ") && !body.includes(prev)) {
        rebuilt[rebuilt.length - 1] = `${prev}\n${text}`;
      } else {
        rebuilt.push(text);
      }
    }
    assert.deepEqual(rebuilt, body);
  });

  it("reads the title, subtitle, author and address from the transcript header", () => {
    assert.ok(article.title.startsWith("Angelina"));
    assert.equal(
      article.subtitle,
      "From Martinez Girlhood to Wyoming Madame to Tahoe Restaurateur",
    );
    assert.equal(article.author, "Michael Dykhorst");
    assert.ok(article.url.startsWith("https://www.sheridanwyominghistory.com/post/"));
  });

  it("takes every chapter title from the post's own subtitle, and breaks where it says", () => {
    assert.equal(chapters.length, CHAPTER_BREAKS.length);
    for (const c of chapters) assert.ok(article.subtitle.includes(c.title), c.title);
    for (const brk of CHAPTER_BREAKS.slice(1)) {
      const chapter = chapters.find((c) => c.slug === brk.slug)!;
      assert.ok(markdown(chapter.blocks[0]).startsWith(brk.startsWith), brk.slug);
    }
  });

  it("gives every block a unique id", () => {
    const ids = chapters.flatMap((c) => [...anchorIds(c)]);
    assert.equal(new Set(ids).size, ids.length);
  });

  it("numbers the plates in the post's order and gives each a door into its chapter", () => {
    plates.forEach((p, i) => {
      assert.equal(p.number, i + 1);
      const chapter = chapters.find((c) => c.slug === p.chapter)!;
      assert.ok(anchorIds(chapter).has(p.paragraph), `${p.id} → ${p.paragraph}`);
    });
  });

  it("only maps images to real plates, and every mapped file exists", () => {
    for (const [id, image] of Object.entries(plateImages)) {
      assert.ok(
        plates.some((p) => p.id === id),
        id,
      );
      assert.ok(existsSync(new URL(`../../public${image.src}`, import.meta.url)), image.src);
    }
  });
});
