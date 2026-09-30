import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  matchScript,
  scriptBlocks,
  similarity,
  spokenLengths,
} from "../../scripts/lib/narration.ts";
import { partCues, PARTS, spokenBlocks } from "./audio.ts";

describe("narration script", () => {
  it("lines up one to one with the site's spoken blocks (lists item by item, the thanks as one)", () => {
    const pairs = matchScript(); // throws if the counts differ
    assert.equal(pairs.length, scriptBlocks().length);
  });

  it("reads each block's own words: every pair shares most of its words, numbers aside", () => {
    const weak = matchScript().filter((p) => similarity(p.site, p.script) < 0.35);
    assert.deepEqual(
      weak.map((p) => p.blocks.join("+")),
      [],
    );
  });

  it("announces every plate caption as a photograph", () => {
    const captions = matchScript().filter((p) => p.blocks[0].startsWith("plate-"));
    assert.equal(captions.length, 39);
    for (const c of captions) assert.match(c.script, /^Photograph\. /, c.blocks[0]);
  });

  it("gives every spoken sentence a spoken length", () => {
    const lengths = spokenLengths();
    for (const b of spokenBlocks())
      assert.ok(
        lengths.get(b.id)?.every((n) => n > 0),
        b.id,
      );
  });

  it("paces every sentence of 25 or more spoken characters between 8 and 30 characters a second", () => {
    const lengths = spokenLengths();
    for (const p of PARTS) {
      for (const c of partCues[p.id].slice(1)) {
        const chars = lengths.get(c.block)![c.sentence];
        if (chars < 25) continue;
        const rate = chars / (c.end - c.start);
        assert.ok(rate > 8 && rate < 30, `${c.id}: ${rate.toFixed(1)} chars/s`);
      }
    }
  });
});
