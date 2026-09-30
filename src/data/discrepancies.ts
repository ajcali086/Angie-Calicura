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
};

export const discrepancies: Discrepancy[] = [
  {
    id: "which-ideal",
    title: "Billings or Sheridan",
    note: "Was the reference meant for the Ideal Hotel in Billings, or the one in Sheridan? At this point in her life, Angie was not yet documented as operating the Ideal in Sheridan, yet no record has surfaced placing her in control of the Billings Ideal either.",
    close: "…the truth may never be fully known.",
    plate: "plate-08",
  },
  {
    id: "pearl-logan",
    title: "For Pearl Logan, or with her",
    note: "It remains unclear whether she initially worked for the well-known madam Pearl Logan or operated in some form of partnership with her…",
    close: "…as no definitive record has yet surfaced.",
    plate: "plate-10",
  },
];
