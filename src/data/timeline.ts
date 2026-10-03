import FROZEN from "../model/frozen.json" with { type: "json" };

/**
 * Dated events, each quoted from the post and linked back to where the
 * post says it. `when` is the date as the post gives it; `sort` only orders
 * the list. `quote` must appear verbatim in exactly one block (or, for a
 * `plate` entry, in that plate's caption); timeline.test.ts holds this.
 * One file per event in timeline/, edited through the CMS; listed by date,
 * then in the order they were frozen.
 */
export type TimelineEvent = {
  /** Frozen: `event-` and the sort date, with a suffix for a second event on the same date. */
  id: string;
  when: string;
  sort: string;
  quote: string;
  /** Set when the event is only in an image caption, not the text. */
  plate?: string;
};

/** The event files, keyed by path ("./timeline/event-1917-07-21.json"), for the file-name check. */
export const timelineFiles = import.meta.glob("./timeline/*.json", {
  eager: true,
  import: "default",
}) as Record<string, TimelineEvent>;

const rank = new Map(FROZEN.timeline.map((id, i) => [id, i]));
export const timeline: TimelineEvent[] = Object.values(timelineFiles).sort(
  (a, b) =>
    a.sort.localeCompare(b.sort) ||
    (rank.get(a.id) ?? Infinity) - (rank.get(b.id) ?? Infinity) ||
    a.id.localeCompare(b.id),
);
