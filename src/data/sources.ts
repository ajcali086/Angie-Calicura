import { chapters, plates, type Plate } from "./article.ts";

/**
 * The record behind the post, drawn from the post: the newspapers its plates
 * reproduce, the records it names in the text, and its own thanks.
 */

/** Publications as the plate captions name them. A caption belongs to the first that it starts with. */
export const PUBLICATIONS = [
  "The Sheridan Press",
  "Casper Star-Tribune",
  "Martinez Daily Standard",
  "Martinez News-Gazette",
  "Daily News, Los Angeles",
  "The Billings Gazette",
  "The Tahoe Tribune",
] as const;

export function platesByPublication(): { name: string; plates: Plate[] }[] {
  const groups = PUBLICATIONS.map((name) => ({
    name: name as string,
    plates: plates.filter((p) => p.caption.startsWith(name)),
  }));
  const claimed = new Set(groups.flatMap((g) => g.plates.map((p) => p.id)));
  return [
    ...groups.filter((g) => g.plates.length),
    { name: "Records, photographs and ephemera", plates: plates.filter((p) => !claimed.has(p.id)) },
  ];
}

/**
 * Sources the post names in its text but does not reproduce. `quote` is the
 * post's own sentence (or the part of it that names the source), verbatim;
 * it is also the door back to the paragraph.
 */
export const namedInText: { name: string; quote: string }[] = [
  {
    name: "1920 U.S. Census",
    quote: "One of the first records Angie appears in is the 1920 US Census",
  },
  {
    name: "Honolulu Star-Bulletin",
    quote:
      'The Honolulu Star-Bulletin arrivals column (September 20, 1937) lists "Miss Angie Calicura"',
  },
  {
    name: "1939 and 1940 Los Angeles City Directories",
    quote: "The 1939 Los Angeles City Directory also lists Angie at this location.",
  },
  {
    name: "1940 U.S. Census",
    quote:
      "The 1940 U.S. Census which was taken on April 30, 1940 shows her residence at 596 South Normandie Avenue",
  },
  {
    name: "Whore Houses of Wyoming",
    quote: 'According to the book, ***"Whore Houses of Wyoming"***',
  },
  {
    name: "George Gilgorea",
    quote: "Historian George Gilgorea wrote:",
  },
  {
    name: "FBI reports, cited by County Attorney Edward J. Redle",
    quote: "The County Attorney, Edward J. Redle, cited FBI reports",
  },
  {
    name: "Billings City Directory, 1958",
    quote: "That same year, she appears in the 1958 Billings City Directory listed as:",
  },
  {
    name: "Carbon County News",
    quote: "A Carbon County News legal notice dated November 28, 1963",
  },
  {
    name: "Billings Times",
    quote: "the *Billings Times* recorded a default judgment of $971.34 entered against her",
  },
  {
    name: "Martinez News-Gazette and Tahoe Daily Tribune obituaries",
    quote: "Angelina's two obituaries.",
  },
  {
    name: "El Dorado County Library",
    quote:
      "In September 2020, I reached out to the El Dorado County Library in Placerville, California",
  },
  {
    name: "I Build the Tower (2006)",
    quote: "The 2006 documentary *I Build the Tower* highlights Rodia's vision",
  },
];

/** The post's closing thanks, one entry per line, verbatim. */
export const thanks: string[] = (() => {
  const last = chapters[chapters.length - 1];
  const start = last.blocks.findIndex((b) => b.type === "p" && b.text.startsWith("Thanks to: "));
  return last.blocks
    .slice(start)
    .flatMap((b) => (b.type === "p" ? [b.text.replace(/^Thanks to: /, "")] : []));
})();
