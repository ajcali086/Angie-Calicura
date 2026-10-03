import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { assigned, frozenIds, unfrozen } from "./article.ts";

/**
 * The ids as first published (2026-09-30): paragraphs 1-p1…1-p21, 2-p1…2-p68,
 * 3-p1…3-p42, plates plate-01…plate-39. Share links, audio cues and the
 * timeline hang on them, so each must stay frozen, or be retired, forever.
 */
const FIRST_PUBLISH = [
  ...[21, 68, 42].flatMap((count, c) =>
    Array.from({ length: count }, (_, i) => `${c + 1}-p${i + 1}`),
  ),
  ...Array.from({ length: 39 }, (_, i) => `plate-${String(i + 1).padStart(2, "0")}`),
];

const frozen = [...frozenIds.blocks, ...frozenIds.plates];

describe("frozen ids", () => {
  it("gives every block and plate a frozen id (run scripts/freeze-ids.ts)", () => {
    assert.deepEqual(
      unfrozen.map((u) => u.text.slice(0, 60)),
      [],
    );
  });

  it("never drops a first-published id: each is still frozen, or retired", () => {
    const kept = new Set([...frozen.map(([id]) => id), ...frozenIds.retired]);
    assert.deepEqual(
      FIRST_PUBLISH.filter((id) => !kept.has(id)),
      [],
    );
  });

  it("never reuses an id: each is frozen once, and a retired id is not frozen", () => {
    const ids = frozen.map(([id]) => id);
    assert.equal(new Set(ids).size, ids.length);
    assert.deepEqual(
      frozenIds.retired.filter((id) => ids.includes(id)),
      [],
    );
  });

  it("matches every frozen id to exactly one block (if a paragraph's opening changed, update its opening, not its id)", () => {
    for (const [id] of frozen) {
      const hits = assigned.filter((a) => a.id === id);
      assert.equal(hits.length, 1, `${id} is used by ${hits.length} blocks`);
    }
  });

  it("keeps first-published ids in their original reading order, so no two were swapped", () => {
    const first = new Set(FIRST_PUBLISH);
    const order = assigned.map((a) => a.id).filter((id) => first.has(id));
    const rank = (id: string) =>
      id.startsWith("plate-")
        ? [0, Number(id.slice(6))]
        : [Number(id.split("-p")[0]), Number(id.split("-p")[1])];
    const blocks = order.filter((id) => !id.startsWith("plate-"));
    const plates = order.filter((id) => id.startsWith("plate-"));
    for (const list of [blocks, plates])
      list.slice(1).forEach((id, i) => {
        const [a, b] = [rank(list[i]), rank(id)];
        assert.ok(a[0] < b[0] || (a[0] === b[0] && a[1] < b[1]), `${list[i]} comes before ${id}`);
      });
  });
});
