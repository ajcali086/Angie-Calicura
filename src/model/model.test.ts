import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { globalId, museum, records, recordsForPlate } from "./index.ts";
import { checks } from "./validate.ts";

describe("model: museum and records (H1 step 1)", () => {
  for (const check of checks) it(check.name, () => assert.deepEqual(check.run(), []));

  it("holds 62 records: 45 verified, 1 unverified, 16 not held", () => {
    const count = (s: string) => records.filter((r) => r.status === s).length;
    assert.deepEqual(
      [records.length, count("verified"), count("unverified"), count("not-held")],
      [62, 45, 1, 16],
    );
  });

  it("froze the museum's IDs on 2026-09-30, and writes global IDs with its prefix", () => {
    assert.equal(museum.id_freeze_date, "2026-09-30");
    assert.equal(globalId("p", "2-p13"), "angie/p/2-p13");
    assert.equal(globalId("r", "plate-13-2"), "angie/r/plate-13-2");
  });

  it("shows plate 13 as five records in the post's order, and plate 31 as one print", () => {
    assert.deepEqual(
      recordsForPlate("plate-13").map((r) => r.id),
      ["plate-13-1", "plate-13-2", "plate-13-3", "plate-13-4", "plate-13-5"],
    );
    const print = recordsForPlate("plate-31");
    assert.equal(print.length, 1);
    assert.equal(print[0].media.length, 2);
    assert.equal(print[0].status, "unverified");
  });
});
