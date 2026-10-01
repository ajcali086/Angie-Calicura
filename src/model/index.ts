import MUSEUM from "./museum.json" with { type: "json" };
import HELD_BACK from "./held-back.json" with { type: "json" };
import RELATIONSHIPS from "./relationships.json" with { type: "json" };
import RECORD_LINKS from "./record-links.json" with { type: "json" };
import EVIDENCE from "./evidence.json" with { type: "json" };
import FROZEN from "./frozen.json" with { type: "json" };
import type {
  Entity,
  EvidenceLink,
  HeldBack,
  Museum,
  MuseumRecord,
  OpenQuestion,
  RecordLink,
  Relationship,
} from "./types.ts";

/**
 * The museum's model, as the site reads it. The data is the JSON beside this
 * file, edited by the curator through the CMS (/admin) or by hand: one file
 * per record, entity and question in its folder, the rest whole.
 * `validate.ts` checks it on every test run and before every build
 * (`npm run check:model`).
 */
export const museum = MUSEUM as Museum;

/** The files of each folder, keyed by path ("./records/plate-01.json"), for the file-name check. */
export const folders = {
  records: import.meta.glob("./records/*.json", { eager: true, import: "default" }),
  entities: import.meta.glob("./entities/*.json", { eager: true, import: "default" }),
  questions: import.meta.glob("./questions/*.json", { eager: true, import: "default" }),
};

/**
 * A folder's entries in the order their IDs were frozen, which is the order
 * the curator first set them in; an entry not yet frozen comes after, by ID.
 */
function inFrozenOrder<T extends { id: string }>(
  files: Record<string, unknown>,
  frozen: string[],
): T[] {
  const rank = new Map(frozen.map((id, i) => [id, i]));
  return (Object.values(files) as T[]).sort(
    (a, b) =>
      (rank.get(a.id) ?? Infinity) - (rank.get(b.id) ?? Infinity) || a.id.localeCompare(b.id),
  );
}

/*
 * The CMS leaves an empty list or a null out of the file it writes (an
 * optional field with nothing in it), so the loader puts them back: code
 * after this point can rely on every list and `framing` being there.
 */
export const records = inFrozenOrder<MuseumRecord>(folders.records, FROZEN.records).map((r) => ({
  ...r,
  media: r.media ?? [],
  notes: r.notes ?? [],
  restoration: null,
}));

export const entities = inFrozenOrder<Entity>(folders.entities, FROZEN.entities).map((e) => ({
  ...e,
  aliases: (e.aliases ?? []).map((a) => ({ ...a, sources: a.sources ?? [] })),
  anchors: e.anchors ?? [],
  framing: e.framing ?? null,
  identity_assertions: (e.identity_assertions ?? []).map((a) => ({
    ...a,
    sources: a.sources ?? [],
  })),
  notes: e.notes ?? [],
}));
/** Names the post uses that no record anchors, with the reason each is held back. */
export const heldBack = (HELD_BACK as unknown as HeldBack[]).map((h) => ({
  ...h,
  sources: h.sources ?? [],
}));

export function entityBySlug(slug: string): Entity | undefined {
  return entities.find((e) => e.slug === slug);
}

/** The entities a record anchors. */
export function entitiesForRecord(id: string): Entity[] {
  return entities.filter((e) => e.anchors.includes(id));
}

export const relationships = RELATIONSHIPS as unknown as Relationship[];
/** Records that show an entity: a person in a photograph, a building photographed. */
export const recordLinks = RECORD_LINKS as unknown as RecordLink[];

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

/** Claims linked to records, typed supports, contradicts or qualifies. */
export const evidence = EVIDENCE as unknown as EvidenceLink[];
/** Left Open: the post's own open questions and those the records raise. */
export const questions = inFrozenOrder<OpenQuestion>(folders.questions, FROZEN.questions).map(
  (q) => ({ ...q, last_known_source: q.last_known_source ?? [], evidence: q.evidence ?? [] }),
);

export function evidenceById(id: string): EvidenceLink | undefined {
  return evidence.find((e) => e.id === id);
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
