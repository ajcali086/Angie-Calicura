import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { plates } from "../data/article.ts";
import { entities, entitiesForRecord, entityBySlug, records } from "./index.ts";
import {
  addedRecords,
  entitiesOnPlate,
  entityByPath,
  entitySection,
  mentionsOf,
  plateStatus,
  questionsAbout,
  relatedPlates,
} from "./connections.ts";

describe("connections: entity pages and plate doors (H1 rendering)", () => {
  it("gives every entity one page, at its section and slug", () => {
    for (const e of entities) assert.equal(entityByPath(entitySection(e), e.slug), e, e.slug);
  });

  it("reaches every entity page from a plate page, from Sources or from the archive's added records", () => {
    const fromPlates = new Set(
      plates.flatMap((p) => entitiesOnPlate(p.id).map((x) => x.entity.id)),
    );
    const fromSources = new Set(
      records.filter((r) => r.cited).flatMap((r) => entitiesForRecord(r.id).map((e) => e.id)),
    );
    const fromAdded = new Set(
      addedRecords().flatMap((r) => entitiesForRecord(r.id).map((e) => e.id)),
    );
    assert.deepEqual(
      entities
        .filter((e) => !fromPlates.has(e.id) && !fromSources.has(e.id) && !fromAdded.has(e.id))
        .map((e) => e.slug),
      [],
    );
  });

  it("offers at most three related plates, each sharing a name, nearest first", () => {
    for (const p of plates) {
      const related = relatedPlates(p.id);
      assert.ok(related.length <= 3, p.id);
      for (const r of related) assert.ok(r.shared.length > 0, `${p.id} → ${r.plate.id}`);
      const gaps = related.map((r) => Math.abs(r.plate.number - p.number));
      assert.deepEqual(
        gaps,
        [...gaps].sort((a, b) => a - b),
        p.id,
      );
    }
  });

  it("marks plate 31 unverified and plate 33 not held; the rest verified", () => {
    const off = plates
      .filter((p) => plateStatus(p.id) !== "verified")
      .map((p) => [p.id, plateStatus(p.id)]);
    assert.deepEqual(off, [
      ["plate-31", "unverified"],
      ["plate-33", "not-held"],
    ]);
  });

  it("finds passages by full names only, so a lone first name claims nothing", () => {
    const angie = entityBySlug("angie")!;
    assert.ok(mentionsOf(angie).length > 0);
    assert.equal(mentionsOf(entityBySlug("baby-amato")!).length > 0, true);
    for (const m of mentionsOf(entityBySlug("jack-wolfe")!))
      assert.ok(m.text.includes("Jack Wolfe"));
  });

  it("points Jack Wolfe's page to the City Marshal question", () => {
    assert.ok(questionsAbout(entityBySlug("jack-wolfe")!).some((q) => q.id === "city-marshal"));
  });
});
