import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, describe, it } from "node:test";
import { exportMuseum, verifyExport } from "./export.ts";

const dir = mkdtempSync(join(tmpdir(), "angie-export-"));
after(() => rmSync(dir, { recursive: true, force: true }));

describe("export (H1 step 6)", () => {
  it("writes the whole museum, media included, and reads back from its own files with nothing unresolved", () => {
    const result = exportMuseum(dir, { withMedia: true, date: "2026-10-01" });
    assert.equal(result.files, 10);
    assert.deepEqual(verifyExport(dir), []);
  });

  it("carries the post's own words for its open questions, so Left Open doesn't need the site", () => {
    const questions = JSON.parse(readFileSync(join(dir, "questions.json"), "utf8"));
    for (const q of questions.filter((x: { origin: string }) => x.origin === "post"))
      assert.ok(q.post_words.close, q.id);
  });

  it("notices when an exported file is tampered with: a quote, an anchor, a media file", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- edits arbitrary exported JSON
    const edit = (name: string, change: (d: any) => void) => {
      const path = join(dir, name);
      const data = JSON.parse(readFileSync(path, "utf8"));
      change(data);
      writeFileSync(path, JSON.stringify(data));
    };
    edit("evidence.json", (d) => (d[0].claim.quote = "words the post never wrote"));
    edit("entities.json", (d) => (d.entities[0].anchors = ["plate-99"]));
    writeFileSync(join(dir, "media", "source", "narration-script.md"), "changed");
    const problems = verifyExport(dir);
    assert.ok(
      problems.some((p) => p.startsWith("ev-001")),
      "quote",
    );
    assert.ok(
      problems.some((p) => p.includes("plate-99")),
      "anchor",
    );
    assert.ok(
      problems.some((p) => p.includes("narration-script.md checksum")),
      "media",
    );
  });
});
