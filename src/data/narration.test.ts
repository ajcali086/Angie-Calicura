import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  matchScript,
  NORMALIZATIONS,
  numberRuns,
  spokenForm,
  unregisteredDifferences,
  PRONUNCIATIONS,
  scriptBlocks,
  similarity,
  spokenLengths,
} from "../../scripts/lib/narration.ts";
import { ARTICLE_SOURCE } from "./article.source.ts";
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

  it("keeps pronunciation respellings in the script and the correct spelling on the site", () => {
    const script = scriptBlocks().join("\n");
    for (const [said, written] of Object.entries(PRONUNCIATIONS)) {
      assert.ok(script.includes(said), `script no longer says ${said}`);
      assert.ok(!ARTICLE_SOURCE.includes(said), `site text shows the respelling ${said}`);
      assert.ok(ARTICLE_SOURCE.includes(written), `site text lacks ${written}`);
    }
    assert.ok(!ARTICLE_SOURCE.includes("Colacucio"), "site text shows the post's typo");
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

  it("differs from the text only by registered rules: numbers spelled out, captions announced, the listed abbreviations and respellings", () => {
    assert.deepEqual(unregisteredDifferences(), []);
    assert.ok(NORMALIZATIONS.some((n) => n.name.includes("Colacurcio")));
  });

  it("would catch an unregistered change: a dropped word or a changed name", () => {
    const site = "On August 3, 1953, Angelina Calicura ran the Rex Hotel.";
    const say = (s: string) => numberRuns(s).join(" ");
    const expected = spokenForm(site, false).join(" ");
    assert.equal(
      say("On August third, nineteen fifty-three, Angelina Calicura ran the Rex Hotel."),
      expected,
    );
    assert.notEqual(
      say("On August third, nineteen fifty-three, Angelina Calicura ran Rex Hotel."),
      expected,
    );
    assert.notEqual(
      say("On August third, nineteen fifty-three, Angela Calicura ran the Rex Hotel."),
      expected,
    );
  });
});
