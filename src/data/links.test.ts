import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { describe, it } from "node:test";
import { article, locate, plateById } from "./article.ts";
import { discrepancies } from "./discrepancies.ts";
import { nav } from "./nav.ts";
import { namedInText, platesByPublication, thanks } from "./sources.ts";
import { timeline } from "./timeline.ts";

// Every item has a door: a quote that resolves to exactly one place in the post.
describe("links", () => {
  it("links the author's name to the About page on Sheridan Wyoming History", () => {
    assert.equal(article.aboutUrl, "https://www.sheridanwyominghistory.com/about");
  });

  it("sends the adaptation note to the original, unedited post", () => {
    assert.equal(
      article.url,
      "https://www.sheridanwyominghistory.com/post/angelina-angie-colacucio-calicura-amato-alexander-a-life-of-hospitality-enterprise-and-reinven",
    );
  });

  it("lands every timeline event on exactly one passage or plate", () => {
    for (const e of timeline) {
      if (e.plate)
        assert.ok(plateById(e.plate)?.caption.includes(e.quote), `${e.when}: not in ${e.plate}`);
      else assert.equal(locate(e.quote).length, 1, `${e.when}: ${e.quote}`);
    }
  });

  it("keeps the timeline in order", () => {
    const sorts = timeline.map((e) => e.sort);
    assert.deepEqual(sorts, [...sorts].sort());
  });

  it("lands every named source on exactly one passage", () => {
    for (const s of namedInText) assert.equal(locate(s.quote).length, 1, s.name);
  });

  it("files every plate under exactly one publication group", () => {
    const ids = platesByPublication().flatMap((g) => g.plates.map((p) => p.id));
    assert.equal(new Set(ids).size, ids.length);
    assert.equal(ids.length, 39);
  });

  it("ends the thanks where the post does", () => {
    assert.equal(thanks[0], "**Judy Armstrong**");
    assert.equal(thanks.at(-1), "**and many other sources.**");
  });

  it("points register entries at plates that exist", () => {
    for (const d of discrepancies) if (d.plate) assert.ok(plateById(d.plate), d.id);
  });

  it("has a route file for every nav item", () => {
    for (const item of nav) {
      const file =
        item.href === "/chapters"
          ? "chapters.index.tsx"
          : item.href === "/archive"
            ? "archive.index.tsx"
            : `${item.href.slice(1)}.tsx`;
      assert.ok(existsSync(new URL(`../routes/${file}`, import.meta.url)), item.href);
    }
  });
});
