import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync, rmSync, writeFileSync } from "node:fs";
import { describe, it } from "node:test";
import { matchScript } from "../../scripts/lib/narration.ts";
import { door } from "./article.ts";
import { discrepancies } from "./discrepancies.ts";
import { namedInText } from "./sources.ts";
import { timeline } from "./timeline.ts";
import { evidence, questions, entities } from "../model/index.ts";

/**
 * The corrections queue, end to end: each case files a correction, runs the
 * build's model check in a fresh process (so the article is re-read with
 * the correction applied), and removes the file again. It writes into the
 * repo, so package.json runs it on its own, after the other tests.
 */
const repo = new URL("../../", import.meta.url);

function check(): { ok: boolean; out: string } {
  try {
    const out = execFileSync(
      process.execPath,
      [
        "--experimental-strip-types",
        "--import",
        "./scripts/test-register.mjs",
        "scripts/check-model.ts",
      ],
      { cwd: repo, encoding: "utf8", stdio: "pipe" },
    );
    return { ok: true, out };
  } catch (e) {
    const err = e as { stdout: string; stderr: string };
    return { ok: false, out: err.stdout + err.stderr };
  }
}

function withFiles(files: Record<string, object>, run: () => void) {
  const paths = Object.keys(files).map((p) => new URL(p, repo));
  const originals = paths.map((p) => {
    try {
      return readFileSync(p, "utf8");
    } catch {
      return null;
    }
  });
  try {
    paths.forEach((p, i) => writeFileSync(p, JSON.stringify(Object.values(files)[i], null, 2)));
    run();
  } finally {
    paths.forEach((p, i) =>
      originals[i] === null ? rmSync(p) : writeFileSync(p, originals[i] as string),
    );
  }
}

const base = {
  reason: "test",
  proposed_by: "tester",
  date: "2026-10-01",
  status: "applied",
  decided_by: "curator",
  decided_on: "2026-10-01",
};

// Words something else quotes: a correction that changes them breaks that link.
const quoted = [
  ...timeline.map((t) => t.quote),
  ...namedInText.map((n) => n.quote),
  ...discrepancies.flatMap((d) => [d.note, d.close].map((q) => q.replace(/^…|…$/g, ""))),
  ...evidence.flatMap((e) => ("quote" in e.claim ? [e.claim.quote] : [])),
  ...entities.flatMap((e) => e.aliases.map((a) => a.name)),
  ...questions.flatMap((q) => [q.post_entry ?? ""]).filter(Boolean),
];
const pairs = matchScript().filter(
  (p) =>
    p.blocks.length === 1 &&
    /^\d-p\d+$/.test(p.blocks[0]) &&
    / Angelina /.test(p.site) &&
    / Angelina /.test(p.script),
);
/** The passage's markdown in article.md. */
const rawOf = (site: string) =>
  readFileSync(new URL("source/article.md", repo), "utf8")
    .split(/\n\s*\n/)
    .find((g) => g.replace(/\*/g, "").includes(site.slice(0, 40)))!;
// One nothing else quotes, and one the timeline does.
const free = pairs.find((p) => !quoted.some((q) => rawOf(p.site).includes(q)))!;
const linked = pairs.find((p) =>
  timeline.some((t) => rawOf(p.site).includes(t.quote) && t.quote.includes(" Angelina ")),
)!;

describe("corrections", () => {
  it("are the only way the text changes, and an applied one must bring the narration with it", () => {
    assert.ok(free, "a paragraph naming Angelina that nothing quotes");
    const target = free.blocks[0];
    const proposed = rawOf(free.site).replace(" Angelina ", " Angie ");
    withFiles(
      {
        "src/data/corrections/c-test1.json": {
          id: "c-test1",
          target,
          proposed_text: proposed,
          ...base,
        },
      },
      () => {
        const r = check();
        assert.equal(r.ok, false);
        assert.match(r.out, /c-test1: the narration script doesn't say the corrected/);
      },
    );
    withFiles(
      {
        "src/data/corrections/c-test1.json": {
          id: "c-test1",
          target,
          proposed_text: proposed,
          narration_text: free.script.replace(" Angelina ", " Angie "),
          ...base,
        },
      },
      () => {
        const r = check();
        assert.equal(r.ok, true, r.out);
        assert.match(r.out, /new ID\(s\), frozen at first publish:[\s\S]*corrections c-test1/);
        assert.match(r.out, /audio to regenerate for 1 applied correction\(s\):\n- c-test1/);
      },
    );
  });

  it("a correction that changes words the timeline quotes breaks the timeline's link, and the build says so", () => {
    assert.ok(linked, "a paragraph the timeline quotes");
    withFiles(
      {
        "src/data/corrections/c-test4.json": {
          id: "c-test4",
          target: linked.blocks[0],
          proposed_text: rawOf(linked.site).replace(" Angelina ", " Angie "),
          narration_text: linked.script.replace(" Angelina ", " Angie "),
          ...base,
        },
      },
      () => {
        const r = check();
        assert.equal(r.ok, false);
        assert.match(r.out, /timeline event-/);
      },
    );
  });

  it("a proposed correction changes nothing yet, but must say who and why", () => {
    const target = free.blocks[0];
    withFiles(
      {
        "src/data/corrections/c-test2.json": {
          id: "c-test2",
          target,
          proposed_text: "x",
          ...base,
          status: "proposed",
          reason: "",
        },
      },
      () => {
        const r = check();
        assert.equal(r.ok, false);
        assert.match(r.out, /c-test2: no reason/);
      },
    );
  });

  it("an applied correction to a passage a discrepancy turns on must name it, and the discrepancy must list it", () => {
    const d = discrepancies[0];
    const hash = door(d.note)!.hash;
    const correction = {
      id: "c-test3",
      target: hash,
      proposed_text: "unused",
      ...base,
      narration_text: "unused",
    };
    withFiles({ "src/data/corrections/c-test3.json": correction }, () => {
      const r = check();
      assert.equal(r.ok, false);
      assert.match(
        r.out,
        new RegExp(`c-test3: edits ${hash}, which ${d.id} turns on, without naming it`),
      );
    });
    withFiles({ "src/data/corrections/c-test3.json": { ...correction, discrepancy: d.id } }, () => {
      assert.match(check().out, new RegExp(`c-test3: ${d.id} doesn't list it`));
    });
  });

  it("refuses an edit to article.md itself", () => {
    const file = new URL("src/data/article.source.ts", repo);
    const original = readFileSync(file, "utf8");
    try {
      writeFileSync(file, original.replace("the 1920 US Census", "the 1920 U.S. Census"));
      const r = check();
      assert.equal(r.ok, false);
      assert.match(r.out, /article\.md was edited; propose a correction instead/);
    } finally {
      writeFileSync(file, original);
    }
  });
});
