import DISCREPANCIES from "./discrepancies.json" with { type: "json" };

/**
 * Where the post leaves a question open in its own words.
 *
 * Same rule as the Both Stand register on spirit-of-martinez: an entry
 * qualifies only where the post itself says the matter is unresolved ("may
 * never be fully known", "no definitive record has yet surfaced"). A
 * question the post answers does not belong here, however interesting.
 *
 * `title` is the only authored string. `note` and `close` are verbatim, with
 * a leading or trailing ellipsis where they cut into a longer sentence.
 */
export type Discrepancy = {
  id: string;
  title: string;
  note: string;
  close: string;
  /** A plate the question turns on. */
  plate?: string;
  /** Closed once a correction or a record settles it; an entry is never deleted. */
  status: "open" | "closed";
  /** Corrections that touch it (their IDs): every one that resolves it or edits its passage. */
  corrections: string[];
  /** Why it was closed, when no correction resolves it (a record settled it, say). */
  closed_note?: string;
};

// The CMS leaves an empty list out of the file it writes; put it back.
export const discrepancies = (DISCREPANCIES as Discrepancy[]).map((d) => ({
  ...d,
  corrections: d.corrections ?? [],
}));
