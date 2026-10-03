import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { describe, it } from "node:test";
import {
  PARTS,
  blockSentences,
  blockWindow,
  cueAt,
  partBlocks,
  partCues,
  partDuration,
  spokenBlocks,
} from "./audio.ts";
import { spoken } from "../lib/sentences.ts";

const partMap = readFileSync(new URL("../../source/audio-part-map.md", import.meta.url), "utf8");

describe("audio parts", () => {
  it("has every part's MP3", () => {
    for (const p of PARTS)
      assert.ok(existsSync(new URL(`../../public${p.src}`, import.meta.url)), p.src);
  });

  it("reads every block of the article exactly once, in order", () => {
    const read = PARTS.flatMap((p) => partBlocks()[p.id].map((b) => b.id));
    assert.deepEqual(
      read,
      spokenBlocks().map((b) => b.id),
    );
  });

  it("breaks the parts where the part map says each one ends", () => {
    const last = (id: string) => spoken(partBlocks()[id as "a1"].at(-1)!.raw);
    assert.equal(last("a1"), "Martinez News-Gazette, Martinez, California, Aug 07, 1951, Page 4"); // "1951 photo caption"
    assert.equal(last("a2a"), "That confrontation came swiftly.");
    assert.match(last("a2b"), /Yellowtail Dam/);
    assert.match(last("a3a"), /aerial photograph from the 1980 Harvey's bombing/);
    assert.match(partMap, /That confrontation came swiftly\./);
    assert.match(partMap, /Yellowtail Dam/);
  });
});

describe("cues", () => {
  it("gives every sentence of every block exactly one cue, in reading order", () => {
    for (const p of PARTS) {
      const expected = [`${p.id}-title`];
      for (const b of partBlocks()[p.id])
        blockSentences(b).forEach((_, i) => expected.push(`${b.id}-s${i}`));
      assert.deepEqual(
        partCues[p.id].map((c) => c.id),
        expected,
        p.id,
      );
    }
  });

  it("runs forward in time within each part's length", () => {
    for (const p of PARTS) {
      let t = 0;
      for (const c of partCues[p.id]) {
        assert.ok(c.start >= t - 0.001, `${c.id} starts before the previous cue ends`);
        assert.ok(c.end > c.start, `${c.id} is empty`);
        t = c.end;
      }
      assert.ok(t <= partDuration(p.id) + 0.01, `${p.id} runs past its audio`);
    }
  });

  it("paces every sentence plausibly: no sentence faster than 30 or slower than 6 characters a second", () => {
    for (const p of PARTS) {
      const blocks = new Map(partBlocks()[p.id].map((b) => [b.id, blockSentences(b)]));
      for (const c of partCues[p.id].slice(1)) {
        const chars = blocks.get(c.block)![c.sentence].length;
        const rate = chars / (c.end - c.start);
        if (chars < 25) continue; // very short sentences are dominated by breath
        assert.ok(rate < 30 && rate > 6, `${c.id}: ${rate.toFixed(1)} chars/s`);
      }
    }
  });

  it("finds the cue at a time, and a block's window", () => {
    const c = partCues.a2a[5];
    assert.equal(cueAt("a2a", (c.start + c.end) / 2)?.id, c.id);
    assert.equal(cueAt("a1", 0)?.id, "a1-title");
    const w = blockWindow("plate-08")!;
    assert.equal(w.part, "a1");
    assert.ok(w.end > w.start);
  });
});
