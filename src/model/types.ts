/**
 * The Story & Record model (architecture-plan spec §1), as this museum
 * holds it. H1 step 1: the museum record and the records catalog.
 *
 * IDs are the museum's frozen local IDs (`2-p13`, `plate-13`); the global
 * form is the museum prefix (`angie/p/2-p13`, `angie/r/plate-13`). Local IDs
 * are never renumbered or reused.
 */
export const SCHEMA_VERSION = 1;

/** What the museum can say about its copy of a record. */
export type RecordStatus =
  /** The museum's copy is what its source published (the post, or the family's scan). */
  | "verified"
  /** Held, but where the copy came from isn't confirmed. Shown to visitors as such. */
  | "unverified"
  /** The record exists (cited, or shown in the post) but the museum has no copy. */
  | "not-held";

export type RecordKind = "photograph" | "document" | "object" | "audio" | "derived_media";

/** How a held copy was captured. Unknowns are stated, not smoothed. */
export type CaptureProvenance =
  { device: string; date: string; collection: string; source: string } | { unknown: string };

/** A dated line in a record's history. A status changes only with one. */
export type RecordNote = { date: string; note: string };

export type MuseumRecord = {
  /** Frozen local ID. */
  id: string;
  kind: RecordKind;
  /** The plate it is shown in: plates are the display unit, records the objects. */
  plate?: string;
  /** For a plate of several objects, its place in the plate (1-based). */
  part?: number;
  title: string;
  /** Where the caption's own words, or the post, say it comes from. */
  credit: string;
  rights_holder: string;
  held: boolean;
  status: RecordStatus;
  /** Repository paths of the files held; empty when not held. */
  media: string[];
  capture_provenance: CaptureProvenance;
  /** Only a restoration that redraws nothing is allowed; none here. */
  restoration: null;
  /** Derived media: the record it is generated from. */
  derived_from?: string;
  /** A record named in the text: its name in src/data/sources.ts. */
  cited?: string;
  notes: RecordNote[];
};

export type ConsentAnswer = "yes" | "no" | "undecided";

/** Structured so it can answer what the shared index (H2) will ask. */
export type ConsentBasis = {
  basis: string;
  granted_by: string;
  recorded: string;
  quote_text_outside_museum: ConsentAnswer;
  plates_to_shared_index: ConsentAnswer;
  limits: string;
};

export type Museum = {
  slug: string;
  title: string;
  rights_holder: string;
  credit_line: string;
  consent_basis: ConsentBasis;
  status: "pilot" | "live" | "archived";
  id_freeze_date: string;
  schema_version: number;
};

export type EntityKind = "person" | "place" | "organization" | "business" | "event" | "family";

/** A name an entity also goes by, and where it is found (record or passage IDs). */
export type Alias = { name: string; sources: string[] };

/**
 * A curator's identity decision, dated and attributed (spec §2.2):
 * - merge: these names (aliases) are this entity;
 * - split: this entity is distinct from those (`with`), despite a shared name;
 * - open: these names may be this entity, but it isn't settled; an open question.
 */
export type IdentityAssertion = {
  action: "merge" | "split" | "open";
  names?: string[];
  with?: string[];
  curator: string;
  date: string;
  rationale: string;
  sources: string[];
};

export type Entity = {
  /** Identity: eight hex characters, never reused. */
  id: string;
  /** Display, for URLs. */
  slug: string;
  kind: EntityKind;
  label: string;
  aliases: Alias[];
  /** Record IDs that anchor it. At least one; no anchorless entities. */
  anchors: string[];
  /** One line, curator-written and dated. Not written yet. */
  framing: null | { text: string; curator: string; date: string };
  identity_assertions: IdentityAssertion[];
  notes: RecordNote[];
};

/** A name the post uses that no record anchors: kept out of the entities, with the reason. */
export type HeldBack = { label: string; kind: EntityKind; reason: string; sources: string[] };
