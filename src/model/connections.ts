import { blockText, chapters, plateById, plates } from "../data/article.ts";
import {
  entities,
  entitiesForRecord,
  questions,
  recordLinksOf,
  records,
  recordsForPlate,
} from "./index.ts";
import type { Entity, MuseumRecord, RecordStatus } from "./types.ts";

/**
 * "How this connects", computed (spec §4): pure functions over the model, so
 * the same catalog gives the same doors on every render. Nothing here is
 * written by hand; if a door appears, the model explains it.
 */

export type EntitySection = "people" | "places" | "businesses" | "organizations";

/** Where an entity's page lives. Families are people. */
export function entitySection(e: Entity): EntitySection {
  if (e.kind === "place") return "places";
  if (e.kind === "business") return "businesses";
  if (e.kind === "organization") return "organizations";
  return "people";
}

export function entityByPath(section: string, slug: string): Entity | undefined {
  return entities.find((e) => e.slug === slug && entitySection(e) === section);
}

/** The plate a record is shown in, if any. */
function plateOf(r: MuseumRecord | undefined) {
  return r?.plate ? plateById(r.plate) : undefined;
}

/**
 * The records that anchor an entity, typed, in reading order: plates in the
 * post's order, then the records the text cites.
 */
export function anchorsInOrder(e: Entity) {
  return recordLinksOf(e.id)
    .map((l) => ({ ...l, rec: records.find((r) => r.id === l.record)! }))
    .sort((a, b) => (plateOf(a.rec)?.number ?? 999) - (plateOf(b.rec)?.number ?? 999));
}

/**
 * The names an entity is found under in running text: its label and aliases,
 * only those of two words or more, so a lone "Jean" or "Sheridan" doesn't
 * claim every passage it appears in.
 */
function searchNames(e: Entity): string[] {
  const bare = e.label.replace(/\s*\([^)]*\)/g, "").replace(/^The /, "");
  return [...new Set([e.label, bare, ...e.aliases.map((a) => a.name)])].filter(
    (n) => n.split(/\s+/).length >= 2,
  );
}

/** The passages that name an entity, in reading order. */
export function mentionsOf(e: Entity): { chapter: string; id: string; text: string }[] {
  const names = searchNames(e);
  const out: { chapter: string; id: string; text: string }[] = [];
  for (const c of chapters)
    for (const b of c.blocks) {
      if (b.type === "figure") continue;
      const text = blockText(b);
      if (names.some((n) => text.includes(n))) out.push({ chapter: c.slug, id: b.id, text });
    }
  return out;
}

/** The entities a plate's records name, with how each record bears on them. */
export function entitiesOnPlate(plateId: string) {
  const seen = new Map<string, { entity: Entity; type: string }>();
  for (const r of recordsForPlate(plateId))
    for (const e of entitiesForRecord(r.id)) {
      const type = recordLinksOf(e.id).find((l) => l.record === r.id)?.type ?? "documented-in";
      if (!seen.has(e.id) || type !== "documented-in") seen.set(e.id, { entity: e, type });
    }
  return [...seen.values()];
}

/**
 * Plates sharing at least one entity with this one, nearest in the post's
 * order first, at most three. A plate that shares none gets none: the record
 * shows its own thinness (the Red Carpenter rule).
 */
export function relatedPlates(plateId: string, cap = 3) {
  const here = plateById(plateId);
  if (!here) return [];
  const mine = new Set(entitiesOnPlate(plateId).map((x) => x.entity.id));
  if (!mine.size) return [];
  return plates
    .filter((p) => p.id !== plateId)
    .map((p) => ({
      plate: p,
      shared: entitiesOnPlate(p.id)
        .map((x) => x.entity)
        .filter((e) => mine.has(e.id)),
    }))
    .filter((x) => x.shared.length > 0)
    .sort(
      (a, b) =>
        Math.abs(a.plate.number - here.number) - Math.abs(b.plate.number - here.number) ||
        a.plate.number - b.plate.number,
    )
    .slice(0, cap);
}

/** The least certain status among a plate's records: unverified or not held, else verified. */
export function plateStatus(plateId: string): RecordStatus {
  const statuses = recordsForPlate(plateId).map((r) => r.status);
  if (statuses.includes("unverified")) return "unverified";
  if (statuses.length && statuses.every((s) => s === "not-held")) return "not-held";
  return "verified";
}

/** What a visitor is told about a plate that isn't verified. */
export const STATUS_LINE: Record<Exclude<RecordStatus, "verified">, string> = {
  unverified: "Unverified: where this copy came from isn't confirmed.",
  "not-held": "Not held: the post shows it; the museum has no copy yet.",
};

/** Left Open questions that rest on an entity's records or on passages naming it. */
export function questionsAbout(e: Entity) {
  const near = new Set([
    ...e.anchors,
    ...e.anchors.flatMap((a) => {
      const plate = records.find((r) => r.id === a)?.plate;
      return plate ? [plate] : [];
    }),
    ...mentionsOf(e).map((m) => m.id),
  ]);
  return questions.filter((q) => q.last_known_source.some((s) => near.has(s)));
}

/** Records added beyond the post: held, shown in no plate, not one the text merely cites. */
export function addedRecords(): MuseumRecord[] {
  return records.filter((r) => r.held && !r.plate && !r.cited && r.kind !== "derived_media");
}

/** A held record's first file, as the site serves it. */
export function mediaSrc(r: MuseumRecord): string | undefined {
  const path = r.media.find((m) => m.startsWith("public/"));
  return path?.slice("public".length);
}
