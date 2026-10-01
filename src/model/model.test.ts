import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  entities,
  entitiesForRecord,
  entityBySlug,
  evidence,
  globalId,
  heldBack,
  museum,
  questions,
  recordLinksOf,
  records,
  recordsForPlate,
  relationships,
  relationshipsOf,
} from "./index.ts";
import { PROPOSED_TYPES } from "./types.ts";
import { checks } from "./validate.ts";

describe("model: H1 steps 1 to 5", () => {
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

  it("draws 44 relationships, 38 from what a record states and 6 from the post's prose", () => {
    const by = (k: string) => relationships.filter((r) => r.provenance.kind === k).length;
    assert.deepEqual([relationships.length, by("derived"), by("curator")], [44, 38, 6]);
  });

  it("gives Angie's family as the records state it", () => {
    const angie = entityBySlug("angie")!;
    const family = relationshipsOf(angie.id)
      .filter((r) => r.type === "family-of")
      .map((r) => r.note);
    assert.deepEqual(family, [
      "mother",
      "father",
      "sister",
      "sibling",
      "uncle",
      "nephew, per plates 12 and 39; plates 1 and 2 make him her parents' great-grandson, a generation further",
      "married, 1958",
      "mother, by the author's inference from plate 9's \"Jean\"",
    ]);
  });

  it("types every anchor: Angie appears in five photographs and is documented in the rest", () => {
    const links = recordLinksOf(entityBySlug("angie")!.id);
    assert.deepEqual(
      links.filter((l) => l.type === "appears-in").map((l) => l.record),
      ["plate-07", "plate-12", "plate-31", "plate-36", "plate-39"],
    );
    assert.ok(links.every((l) => l.type === "appears-in" || l.type === "documented-in"));
  });

  it("draws no owns or operated edge to either Ideal from plate 8", () => {
    assert.ok(
      relationships.every(
        (r) => r.provenance.kind !== "derived" || r.provenance.record !== "plate-08",
      ),
    );
  });

  it("marks officer-of as a type proposed here, not yet in the spec", () => {
    assert.deepEqual([...PROPOSED_TYPES], ["officer-of"]);
    assert.equal(relationships.filter((r) => r.type === "officer-of").length, 7);
  });

  it("links 54 claims to records: 42 support, 6 contradict, 6 qualify", () => {
    const t = (x: string) => evidence.filter((l) => l.type === x).length;
    assert.deepEqual(
      [evidence.length, t("supports"), t("contradicts"), t("qualifies")],
      [54, 42, 6, 6],
    );
  });

  it("lets the records contradict the post where they do, and keeps both", () => {
    const contradicted = evidence
      .filter((l) => l.type === "contradicts")
      .map((l) => ("quote" in l.claim ? l.claim.quote.slice(0, 40) : ""));
    assert.deepEqual(contradicted, [
      "The couple relocated to South Lake Tahoe",
      "**Tarantino's Restaurant (1970s)**: Ange",
      "171 North Main Street",
      "171 North Main Street",
      "City Marshal Jack Wolfe described an att",
      "strongly believed the ceremony took plac",
    ]);
  });

  it("records the cross-museum link to Spirit of Martinez without editing its claim", () => {
    const cross = evidence.filter((l) => l.holding_museum);
    assert.equal(cross.length, 1);
    assert.equal(cross[0].holding_museum, "spirit-of-martinez");
    assert.equal(cross[0].record, "plate-03");
  });

  it("keeps nine open questions: the post's two and seven the records raise, none answered", () => {
    assert.deepEqual(
      questions.map((q) => [q.id, q.origin]),
      [
        ["which-ideal", "post"],
        ["pearl-logan", "post"],
        ["city-marshal", "records"],
        ["ideal-address", "records"],
        ["donna-spelling", "records"],
        ["wedding-place", "records"],
        ["tahoe-move", "records"],
        ["tarantinos-order", "records"],
        ["andrew-generation", "records"],
      ],
    );
    assert.ok(questions.every((q) => q.status === "open"));
  });
});
