import MUSEUM from "./museum.json" with { type: "json" };
import RECORDS from "./records.json" with { type: "json" };
import ENTITIES from "./entities.json" with { type: "json" };
import RELATIONSHIPS from "./relationships.json" with { type: "json" };
import type { Entity, HeldBack, Museum, MuseumRecord, RecordLink, Relationship } from "./types.ts";

/**
 * The museum's model, as the site reads it. The data is the JSON beside this
 * file, edited by the curator; `validate.ts` checks it on every test run and
 * before every build (`npm run check:model`).
 */
export const museum = MUSEUM as Museum;
export const records = RECORDS as unknown as MuseumRecord[];

export const entities = ENTITIES.entities as unknown as Entity[];
/** Names the post uses that no record anchors, with the reason each is held back. */
export const heldBack = ENTITIES.held_back as unknown as HeldBack[];

export function entityBySlug(slug: string): Entity | undefined {
  return entities.find((e) => e.slug === slug);
}

/** The entities a record anchors. */
export function entitiesForRecord(id: string): Entity[] {
  return entities.filter((e) => e.anchors.includes(id));
}

export const relationships = RELATIONSHIPS.relationships as unknown as Relationship[];
/** Records that show an entity: a person in a photograph, a building photographed. */
export const recordLinks = RELATIONSHIPS.record_links as unknown as RecordLink[];

/** Every typed edge touching an entity, either way round. */
export function relationshipsOf(entityId: string): Relationship[] {
  return relationships.filter((r) => r.from === entityId || r.to === entityId);
}

/**
 * How a record bears on an entity: `appears-in` or `photographed-at` where its
 * caption or image says so, otherwise `documented-in`. Derived from the
 * anchors, so every anchor has exactly one type.
 */
export function recordLinksOf(
  entityId: string,
): { record: string; type: RecordLink["type"] | "documented-in" }[] {
  const e = entities.find((x) => x.id === entityId);
  if (!e) return [];
  return e.anchors.map((record) => ({
    record,
    type:
      recordLinks.find((l) => l.entity === entityId && l.record === record)?.type ??
      "documented-in",
  }));
}

export function recordById(id: string): MuseumRecord | undefined {
  return records.find((r) => r.id === id);
}

/** The records a plate shows, in the plate's order. */
export function recordsForPlate(plate: string): MuseumRecord[] {
  return records.filter((r) => r.plate === plate).sort((a, b) => (a.part ?? 0) - (b.part ?? 0));
}

/** The global form of a local ID: passage, record, entity, question, thread. */
export function globalId(kind: "p" | "r" | "e" | "q" | "t", id: string): string {
  return `${museum.slug}/${kind}/${id}`;
}
