import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { discrepancies } from "./discrepancies.ts";
import { namedInText } from "./sources.ts";
import { timeline } from "./timeline.ts";

// Read straight off disk, not through the parser: a quote that isn't in the
// transcript is new prose, which this site must not contain.
const transcript = readFileSync(new URL("../../source/article.md", import.meta.url), "utf8");
const unelided = (q: string) => q.replace(/^…/, "").replace(/…$/, "");

describe("verbatim", () => {
  it("quotes every timeline event from the transcript", () => {
    for (const e of timeline) assert.ok(transcript.includes(e.quote), e.when);
  });

  it("quotes every named source from the transcript", () => {
    for (const s of namedInText) assert.ok(transcript.includes(s.quote), s.name);
  });

  it("quotes every register note and close line from the transcript", () => {
    for (const d of discrepancies) {
      assert.ok(transcript.includes(unelided(d.note)), `${d.id} note`);
      assert.ok(transcript.includes(unelided(d.close)), `${d.id} close`);
    }
  });
});

describe("verbatim page quotes", () => {
  it("quotes the home opening and the Left Open epigraph from the transcript", () => {
    assert.ok(
      transcript.includes("So, who remembers Angie, the notorious madam of the Ideal Hotel?"),
    );
    assert.ok(transcript.includes("What survives is a silhouette rather than a full portrait"));
  });
});
