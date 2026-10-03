import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  cardBandHeight,
  coverFit,
  fitCardText,
  MIN_PASSAGE_HEIGHT,
  shrinkToFit,
  SNIPPET_CARD_HEIGHT,
  wrapLines,
  type Measure,
} from "./snippetCard.ts";

describe("coverFit", () => {
  it("returns the box unchanged when the ratios already match", () => {
    const { src, dst } = coverFit(1000, 500, 200, 100);
    assert.deepEqual(src, { x: 0, y: 0, w: 1000, h: 500 });
    assert.deepEqual(dst, { x: 0, y: 0, w: 200, h: 100 });
  });

  it("crops the sides of a source that is relatively wider than the box", () => {
    const { src } = coverFit(2000, 1000, 100, 100); // 2:1 source into a 1:1 box
    assert.equal(src.h, 1000);
    assert.equal(src.w, 1000);
    assert.equal(src.x, 500); // centered crop
    assert.equal(src.y, 0);
  });

  it("crops the top and bottom of a source that is relatively taller than the box", () => {
    const { src } = coverFit(1000, 2000, 100, 50); // portrait source into a 2:1 box
    assert.equal(src.w, 1000);
    assert.equal(src.h, 500);
    assert.equal(src.x, 0);
    assert.equal(src.y, 750);
  });

  it("never returns a negative or NaN rect for degenerate input", () => {
    const { src, dst } = coverFit(0, 0, 100, 100);
    assert.ok(Number.isFinite(src.w) && Number.isFinite(src.h));
    assert.deepEqual(dst, { x: 0, y: 0, w: 100, h: 100 });
  });
});

describe("cardBandHeight", () => {
  // Band bottom to first line of text; mirrors KICKER_GAP + FOOTER_HEIGHT.
  const reserved = 104 + 108;
  const passageRoom = (band: number) => SNIPPET_CARD_HEIGHT - reserved - band;

  it("gives a landscape plate its full 0.6 ratio", () => {
    assert.equal(cardBandHeight(false), 810);
  });

  it("clamps a portrait plate so the passage keeps its minimum", () => {
    const band = cardBandHeight(true);
    assert.ok(band < Math.round(SNIPPET_CARD_HEIGHT * 0.78), "should be clamped");
    assert.equal(passageRoom(band), MIN_PASSAGE_HEIGHT);
  });

  it("still gives a portrait plate a taller band than a landscape one", () => {
    assert.ok(cardBandHeight(true) > cardBandHeight(false));
  });

  it("never leaves the passage less room than the minimum", () => {
    for (const portrait of [true, false]) {
      assert.ok(passageRoom(cardBandHeight(portrait)) >= MIN_PASSAGE_HEIGHT);
    }
  });
});

// A fake measurer: every character is `size * 0.5` wide, so widths are exact
// and predictable without a real canvas.
const fakeMeasure: Measure = (text, size) => text.length * size * 0.5;

describe("wrapLines", () => {
  it("keeps words together until the line would overflow", () => {
    // "aa bb cc" at size 20 -> each word is 20px, space negligible in this fake;
    // "aa bb" is 5 chars * 10 = 50, fits in 60; adding "cc" makes 8*10=80, overflows.
    const lines = wrapLines("aa bb cc", 20, 60, fakeMeasure);
    assert.deepEqual(lines, ["aa bb", "cc"]);
  });

  it("never splits a single word, even one wider than maxWidth", () => {
    const lines = wrapLines("supercalifragilisticexpialidocious", 20, 10, fakeMeasure);
    assert.deepEqual(lines, ["supercalifragilisticexpialidocious"]);
  });

  it("collapses repeated whitespace", () => {
    const lines = wrapLines("a   b\tc", 20, 1000, fakeMeasure);
    assert.deepEqual(lines, ["a b c"]);
  });
});

describe("shrinkToFit", () => {
  it("keeps the largest size that already fits", () => {
    const { size, lines } = shrinkToFit("short", {
      maxWidth: 1000,
      maxHeight: 1000,
      from: 56,
      to: 34,
      measure: fakeMeasure,
    });
    assert.equal(size, 56);
    assert.deepEqual(lines, ["short"]);
  });

  it("steps down to a size that fits a constrained box", () => {
    const text = "one two three four five six seven eight";
    const { size } = shrinkToFit(text, {
      maxWidth: 200,
      maxHeight: 120,
      from: 56,
      to: 20,
      lineHeight: 1.2,
      measure: fakeMeasure,
    });
    assert.ok(size < 56, "should have shrunk from the starting size");
    assert.ok(size >= 20, "should not go below the floor");
  });

  it("returns the floor size rather than looping forever when nothing fits", () => {
    const text = "one two three four five six seven eight nine ten";
    const result = shrinkToFit(text, {
      maxWidth: 30,
      maxHeight: 10,
      from: 56,
      to: 34,
      measure: fakeMeasure,
    });
    assert.equal(result.size, 34);
    assert.ok(result.lines.length > 0);
  });
});

const words = (n: number, prefix = "word") =>
  Array.from({ length: n }, (_, i) => `${prefix}${i}`).join(" ") + ".";

describe("fitCardText", () => {
  it("shows a short passage verbatim, untruncated", () => {
    const result = fitCardText(["A short sentence."]);
    assert.deepEqual(result, {
      ok: true,
      text: "A short sentence.",
      truncated: false,
    });
  });

  it("joins several short sentences under the cap verbatim", () => {
    const result = fitCardText(["First sentence.", "Second sentence."]);
    assert.equal(result.ok, true);
    assert.equal(result.ok && result.text, "First sentence. Second sentence.");
    assert.equal(result.ok && result.truncated, false);
  });

  it("refuses a single sentence over the hard cap rather than cutting mid-sentence", () => {
    const result = fitCardText([words(61)]);
    assert.equal(result.ok, false);
  });

  it("keeps the leading sentences that fit the target and marks it truncated", () => {
    // Four 20-word sentences, 80 words total: over the 60-word hard cap, so
    // this truncates. Distinct prefixes make each sentence identifiable.
    const result = fitCardText([words(20, "a"), words(20, "b"), words(20, "c"), words(20, "d")]);
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.ok(result.text.endsWith("…"));
      assert.ok(result.truncated);
      assert.ok(result.text.includes("a0"), "keeps the first sentence");
      assert.ok(
        result.text.includes("b0"),
        "keeps the second sentence (40 words, still under the 45-word target)",
      );
      assert.ok(
        !result.text.includes("c0"),
        "drops the third sentence (would push past the target)",
      );
      assert.ok(!result.text.includes("d0"), "drops the fourth sentence");
    }
  });

  it("refuses when even the first sentence alone busts the target", () => {
    // 61 + 5 = 66 words, over the hard cap, so this tries to truncate — but
    // the first sentence alone (61 words) already exceeds the 45-word
    // target, so there's nothing safe to keep.
    const result = fitCardText([words(61), words(5)]);
    assert.equal(result.ok, false);
  });

  it("rejects empty input", () => {
    assert.equal(fitCardText([]).ok, false);
    assert.equal(fitCardText(["   "]).ok, false);
  });
});
