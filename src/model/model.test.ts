import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  entities,
  entitiesForRecord,
  entityBySlug,
  globalId,
  heldBack,
  museum,
  records,
  recordsForPlate,
} from "./index.ts";
import { checks } from "./validate.ts";

describe("model: museum, records and entities (H1 steps 1 and 2)", () => {
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

  it("derives 51 entities: 23 people, 11 places, 11 businesses, 5 organizations, 1 family", () => {
    const count = (k: string) => entities.filter((e) => e.kind === k).length;
    assert.deepEqual(
      ["person", "place", "business", "organization", "family"].map(count),
      [23, 11, 11, 5, 1],
    );
  });

  it("keeps Angie's names on one entity, each merge sourced, and her mother apart", () => {
    const angie = entityBySlug("angie")!;
    assert.equal(angie.aliases.length, 17);
    const mother = entityBySlug("angiolina-rodia-calicura")!;
    assert.ok(
      angie.identity_assertions.some((x) => x.action === "split" && x.with?.includes(mother.id)),
    );
  });

  it("labels people by the record's spelling and keeps the post's as an alias", () => {
    assert.equal(entityBySlug("joseph-minnehan")!.aliases[0].name, "Joseph Minnehahn");
    const donna = entityBySlug("donna-dreyer")!;
    assert.deepEqual(
      donna.identity_assertions.map((x) => [x.action, x.names?.[0]]),
      [
        ["merge", "Donna Dyer"],
        ["open", "Donna Dryer"],
      ],
    );
  });

  it("holds back the names no record anchors, City Marshal Jack Wolfe among them", () => {
    assert.deepEqual(
      heldBack.map((h) => h.label),
      [
        "Pearl Logan",
        "City Marshal Jack Wolfe",
        "Elko, Nevada",
        "Angie's Place",
        "Ideal Hotel (Billings)",
      ],
    );
  });

  it("finds a plate's entities from its record: the 1953 council minutes name Angie, the Rex Hotel and Sheridan", () => {
    assert.deepEqual(
      entitiesForRecord("plate-10").map((e) => e.slug),
      ["angie", "sheridan", "rex-hotel", "city-of-sheridan"],
    );
  });
});
