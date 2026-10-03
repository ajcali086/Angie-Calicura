import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { describe, it } from "node:test";

/**
 * Files as the CMS writes them. Sveltia leaves an empty optional field out
 * (an empty list, a null), and the build must take them as they come. Each
 * case rewrites real files the way the CMS does, runs the build's model
 * check in a fresh process, and puts the files back. It writes into the
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

function rewritten(edits: Record<string, (d: Record<string, unknown>) => void>, run: () => void) {
  const saved = Object.keys(edits).map((p) => [p, readFileSync(new URL(p, repo), "utf8")] as const);
  try {
    for (const [path, text] of saved) {
      const data = JSON.parse(text);
      edits[path](data);
      writeFileSync(new URL(path, repo), JSON.stringify(data, null, 2) + "\n");
    }
    run();
  } finally {
    for (const [path, text] of saved) writeFileSync(new URL(path, repo), text);
  }
}

describe("files as the CMS writes them", () => {
  it("builds from entries saved without their empty lists and nulls", () => {
    rewritten(
      {
        "src/model/records/plate-13-2.json": (d) => delete d.notes,
        "src/model/entities/angie.json": (d) => {
          delete d.framing;
          delete d.notes;
        },
        "src/data/discrepancies.json": (d) => {
          for (const x of d as unknown as Record<string, unknown>[]) delete x.corrections;
        },
      },
      () => {
        const r = check();
        assert.equal(r.ok, true, r.out);
      },
    );
  });

  it("refuses a record whose file is renamed away from its frozen ID", () => {
    rewritten({ "src/model/records/plate-13-2.json": (d) => (d.id = "plate-13-two") }, () => {
      const r = check();
      assert.equal(r.ok, false);
      assert.match(r.out, /records\/plate-13-2\.json: named for plate-13-two/);
      assert.match(r.out, /records plate-13-2 was frozen and is gone/);
    });
  });
});
