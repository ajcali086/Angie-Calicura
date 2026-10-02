import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { parse } from "yaml";
import { discrepancies } from "../../src/data/discrepancies.ts";
import { timeline } from "../../src/data/timeline.ts";
import {
  entities,
  evidence,
  heldBack,
  questions,
  recordLinks,
  records,
  relationships,
} from "../../src/model/index.ts";
import { buildConfig, entityOptions, keyPage, optionSets } from "./cms.ts";

const source = readFileSync(new URL("../../src/cms/config.yml", import.meta.url), "utf8");
const sets = optionSets();
const values = (set: string) => new Set(sets[set].map((o) => o.value));

/** Each ID the data stores, with the set its dropdown offers. */
const stored: [string, string, (string | undefined)[]][] = [
  ["relationships.from", "@entities", relationships.map((r) => r.from)],
  ["relationships.to", "@entities", relationships.map((r) => r.to)],
  [
    "relationships.provenance.record",
    "@records",
    relationships.map((r) => (r.provenance.kind === "derived" ? r.provenance.record : undefined)),
  ],
  [
    "relationships.provenance.passage",
    "@passages",
    relationships.map((r) => (r.provenance.kind === "curator" ? r.provenance.passage : undefined)),
  ],
  ["record_links.entity", "@entities", recordLinks.map((l) => l.entity)],
  ["record_links.record", "@records", recordLinks.map((l) => l.record)],
  ["evidence.record", "@records", evidence.map((l) => l.record)],
  [
    "evidence.claim.passage",
    "@passages",
    evidence.map((l) => ("passage" in l.claim ? l.claim.passage : undefined)),
  ],
  [
    "evidence.claim.plate",
    "@plates",
    evidence.map((l) => ("plate" in l.claim ? l.claim.plate : undefined)),
  ],
  ["records.plate", "@plates", records.map((r) => r.plate)],
  ["records.shown_at", "@passages", records.map((r) => r.shown_at)],
  ["records.derived_from", "@derivation-sources", records.map((r) => r.derived_from)],
  [
    "entities.aliases.sources",
    "@claim-sources",
    entities.flatMap((e) => e.aliases.flatMap((a) => a.sources)),
  ],
  [
    "entities.identity_assertions.with",
    "@entities",
    entities.flatMap((e) => e.identity_assertions.flatMap((a) => a.with ?? [])),
  ],
  [
    "entities.identity_assertions.sources",
    "@claim-sources",
    entities.flatMap((e) => e.identity_assertions.flatMap((a) => a.sources)),
  ],
  ["questions.last_known_source", "@claim-sources", questions.flatMap((q) => q.last_known_source)],
  ["questions.evidence", "@evidence", questions.flatMap((q) => q.evidence)],
  ["held_back.sources", "@claim-sources", heldBack.flatMap((h) => h.sources)],
  ["timeline.plate", "@plates", timeline.map((t) => t.plate)],
  ["discrepancies.plate", "@plates", discrepancies.map((d) => d.plate)],
  ["discrepancies.corrections", "@corrections", discrepancies.flatMap((d) => d.corrections)],
];

describe("the CMS's dropdowns", () => {
  it("offer every ID the archive already stores, so the CMS never shows one as invalid or drops it", () => {
    for (const [field, set, ids] of stored) {
      const offered = values(set);
      const missing = ids.filter((id): id is string => !!id && !offered.has(id));
      assert.deepEqual(missing, [], `${field}: not offered by ${set}`);
    }
  });

  it("show entities by name, grouped by kind, each once", () => {
    const options = entityOptions();
    assert.equal(options.length, entities.length);
    assert.equal(new Set(options.map((o) => o.value)).size, entities.length);
    const angie = options.find((o) => o.value === entities.find((e) => e.slug === "angie")!.id);
    assert.equal(angie?.label, 'Person · Angelina "Angie" Calicura');
    // grouped: all people before any place, all places before any business
    const kinds = options.map((o) => o.label.split(" · ")[0]);
    assert.deepEqual(
      kinds.filter((k, i) => k !== kinds[i - 1]),
      [...new Set(kinds)],
    );
  });

  it("never offer the same ID twice in one set", () => {
    for (const [name, options] of Object.entries(sets))
      assert.equal(new Set(options.map((o) => o.value)).size, options.length, name);
  });

  it("fill every set the config names, and refuse one it doesn't know", () => {
    const config = parse(buildConfig(source));
    assert.doesNotMatch(JSON.stringify(config), /"options":"@/);
    assert.throws(
      () => buildConfig(source.replace('"@entities"', '"@entites"')),
      /no option set @entites/,
    );
    // The CMS refuses a dropdown with no options: an empty set becomes plain text.
    const selects: { name: string; options: unknown[] }[] = [];
    JSON.stringify(config, (_k, v) => {
      if (v && v.widget === "select") selects.push(v);
      return v;
    });
    assert.ok(selects.length > 20, "the dropdowns are there");
    for (const f of selects)
      assert.ok(f.options.length > 0, `${f.name}: a dropdown with no options`);
  });

  it("list every entity in the ID key, by name and ID", () => {
    const html = keyPage(relationships);
    for (const e of entities) {
      assert.ok(html.includes(`id="${e.id}"`), e.slug);
      assert.ok(html.includes(`<code>${e.id}</code>`), e.slug);
    }
    assert.equal((html.match(/<li>/g) ?? []).length, relationships.length);
  });
});
