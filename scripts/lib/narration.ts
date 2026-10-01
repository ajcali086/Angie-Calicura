/**
 * The narration script (source/narration-script.md) matched to the site's
 * spoken blocks. The script is the article normalized for speech: numbers
 * written out, "Photograph." before each caption, abbreviations expanded
 * ("Mrs." → "Missus"), emphasis removed, and names respelled for the voice
 * (PRONUNCIATIONS). The script is heard, never shown. Two rules make its 170
 * blocks line up one to one with the site's 172:
 *   - a list is read item by item, one script block per item;
 *   - the closing thanks (nine lines on the site) is read as one block.
 * Used by scripts/align-audio.ts to time the audio by what was actually
 * said, and by narration.test.ts to hold the match.
 */
import { readFileSync } from "node:fs";
import { chapters } from "../../src/data/article.ts";
import { appliedCorrections } from "../../src/data/corrections.ts";
import { spokenBlocks } from "../../src/data/audio.ts";
import { splitSentences, spoken } from "../../src/lib/sentences.ts";

/**
 * Script spelling → correct spelling. The script misspells these on purpose
 * so the TTS voice pronounces them right; the site shows only the correct
 * spelling.
 */
export const PRONUNCIATIONS: Record<string, string> = {
  Colacurchio: "Colacurcio",
};

export function scriptBlocks(): string[] {
  return readFileSync(new URL("../../source/narration-script.md", import.meta.url), "utf8")
    .split(/\n\s*\n/)
    .map((s) => s.trim())
    .filter((s) => s && s !== "[pause]");
}

/** The site's spoken blocks as the script groups them, each with the script text that reads it. */
export function matchScript(): { blocks: string[]; site: string; script: string }[] {
  const script = scriptBlocks();
  const lists = new Map(
    chapters.flatMap((c) =>
      c.blocks.flatMap((b) => (b.type === "list" ? [[b.id, b.items] as const] : [])),
    ),
  );
  const units: { blocks: string[]; site: string }[] = [];
  let thanks: { blocks: string[]; site: string } | null = null;
  for (const b of spokenBlocks()) {
    const items = lists.get(b.id);
    if (items) {
      items.forEach((it) => units.push({ blocks: [b.id], site: spoken(it) }));
      continue;
    }
    const text = spoken(b.raw);
    if (thanks) {
      thanks.blocks.push(b.id);
      thanks.site += ` ${text}`;
      continue;
    }
    if (text.startsWith("Thanks to:")) {
      thanks = { blocks: [b.id], site: text };
      units.push(thanks);
      continue;
    }
    units.push({ blocks: [b.id], site: text });
  }
  if (units.length !== script.length) {
    throw new Error(
      `narration script has ${script.length} blocks; the site groups into ${units.length}`,
    );
  }
  // An applied correction brings the script's words for its passage with it:
  // one block, or one per item of a list.
  for (const c of appliedCorrections.values()) {
    if (!c.narration_text) continue;
    const at = units.flatMap((u, i) => (u.blocks.includes(c.target) ? [i] : []));
    const said = c.narration_text.split(/\n\s*\n/).map((t) => t.trim());
    if (at.length !== said.length)
      throw new Error(
        `${c.id}: narration_text has ${said.length} block(s); ${c.target} is read as ${at.length}`,
      );
    at.forEach((i, k) => (script[i] = said[k]));
  }
  return units.map((u, i) => ({ ...u, script: script[i] }));
}

/** Word overlap between a site block and its script block, ignoring numbers (which the script spells out). */
export function similarity(a: string, b: string): number {
  const words = (t: string) =>
    new Set(
      t
        .toLowerCase()
        .replace(/^photograph\.\s*/, "")
        .replace(/[^a-z\s]/g, " ")
        .split(/\s+/)
        .filter((w) => w.length > 3),
    );
  const A = words(a);
  const B = words(b);
  let n = 0;
  for (const w of A) if (B.has(w)) n++;
  return n / Math.max(1, Math.max(A.size, B.size));
}

/**
 * How many characters the narrator speaks for each sentence of a site block.
 * When the script block splits into the same number of sentences, each gets
 * its own spoken length; otherwise the block's spoken length is shared out in
 * proportion to the site sentences.
 */
export function spokenLengths(): Map<string, number[]> {
  const out = new Map<string, number[]>();
  const perBlock = new Map<string, string[]>();
  for (const u of matchScript()) {
    if (u.blocks.length === 1) {
      perBlock.set(u.blocks[0], [...(perBlock.get(u.blocks[0]) ?? []), u.script]);
    } else {
      // the merged thanks: share the script text out by site length
      const sites = u.blocks.map((id) => spoken(spokenBlocks().find((b) => b.id === id)!.raw));
      const total = sites.reduce((t, s) => t + s.length, 0);
      u.blocks.forEach((id, k) =>
        perBlock.set(id, [
          `${"x".repeat(Math.round((sites[k].length / total) * u.script.length))}`,
        ]),
      );
    }
  }
  for (const b of spokenBlocks()) {
    const siteSentences = splitSentences(spoken(b.raw));
    const scripts = perBlock.get(b.id) ?? [];
    // a list's items are its sentences, one script block each
    const scriptSentences = scripts.length > 1 ? scripts : splitSentences(scripts[0] ?? "");
    if (scriptSentences.length === siteSentences.length) {
      out.set(
        b.id,
        scriptSentences.map((s) => s.length + 1),
      );
    } else {
      const total = scriptSentences.join(" ").length;
      const siteTotal = siteSentences.join(" ").length;
      out.set(
        b.id,
        siteSentences.map((s) => ((s.length + 1) / siteTotal) * total),
      );
    }
  }
  return out;
}

/**
 * Every way the script may differ from the canonical text, registered (H1
 * step 6). Each rule rewrites the site's text into what the script says;
 * after them, the two must match word for word, numbers aside (see
 * `numberRuns`). A difference no rule explains is an error in one or the
 * other, never a silent edit. Limit: a number is checked as present, not for
 * its value ("1953" and "nineteen fifty-four" both collapse to "#"); the
 * many ways a figure is read aloud (years in pairs, addresses, area codes)
 * would need a reader of their own.
 */
export const NORMALIZATIONS: { name: string; from: RegExp; to: string }[] = [
  ...Object.entries(PRONUNCIATIONS).map(([said, written]) => ({
    name: `pronunciation: ${written} said as ${said}`,
    from: new RegExp(`\\b${written}\\b`, "g"),
    to: said,
  })),
  { name: "abbreviation: Mrs.", from: /\bMrs\.?(?=\s|,|$)/g, to: "Missus" },
  { name: "abbreviation: Mr.", from: /\bMr\.(?=\s)/g, to: "Mister" },
  { name: "abbreviation: Dr.", from: /\bDr\.(?=\s)/g, to: "Doctor" },
  { name: "abbreviation: No. before a number", from: /\bNo\.\s(?=\d)/g, to: "Number " },
  { name: "abbreviation: W. and N. before a street", from: /\b([WN])\.\s(?=\d|Main)/g, to: "$1 " },
  { name: "abbreviation: W. read West", from: /\bW (?=\d)/g, to: "West " },
  { name: "abbreviation: N. read North", from: /\bN (?=Main)/g, to: "North " },
  { name: "abbreviation: St. after a street", from: /(\d(?:st|nd|rd|th)) St\./g, to: "$1 Street" },
  { name: "abbreviation: Ave.", from: /\bAve\b\.?/g, to: "Avenue" },
  { name: "abbreviation: Blvd", from: /\bBlvd\b\.?/g, to: "Boulevard" },
  { name: "abbreviation: month names", from: /\b(Jun|Jul|Aug|Dec)\b\.?/g, to: "$1_MONTH" },
  { name: "abbreviation: dba", from: /\bdba\b/g, to: "doing business as" },
  { name: "initialism: U.S. and US spelled out", from: /\bU\.?S\.?(?=\s)/g, to: "U S" },
  { name: "initialism: IMDb spelled out", from: /\bIMDb\b/g, to: "I M D B" },
  { name: "numeral: II read as two", from: /\bII\b/g, to: "two" },
  { name: "abbreviation: a directory's r (residence)", from: /\b[Rr]\s?(?=\d)/g, to: "residence " },
  { name: "symbol: & read as and", from: /\s&\s/g, to: " and " },
  { name: "range: a dash between words read as to", from: /([a-z])–([a-z])/gi, to: "$1 to $2" },
];

const MONTHS: Record<string, string> = { Jun: "June", Jul: "July", Aug: "August", Dec: "December" };

const NUMBER_WORDS = new Set(
  (
    "zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen " +
    "twenty thirty forty fifty sixty seventy eighty ninety hundred thousand million " +
    "first second third fourth fifth sixth seventh eighth ninth tenth eleventh twelfth thirteenth fourteenth fifteenth sixteenth " +
    "seventeenth eighteenth nineteenth twentieth thirtieth twenties thirties forties fifties sixties seventies eighties nineties"
  ).split(" "),
);
/** Words that join a run of numbers ("thirteen oh nine and a half", "two dollars and ten cents"). */
const JOINERS = new Set(["oh", "and", "a", "half", "to", "dollars", "cents"]);

/** Lowercase words, with digits, number words and their joiners collapsed to "#". */
export function numberRuns(text: string): string[] {
  const words =
    text
      .replace(/\*+/g, "")
      .replace(/[’‘]/g, "'")
      .toLowerCase()
      .match(/[a-z]+(?:'[a-z]+)?|\$?\d[\d,.]*(?:st|nd|rd|th|s)?½?|½/g) ?? [];
  const isNum = (w: string) =>
    /\d|½/.test(w) || NUMBER_WORDS.has(w) || w.split("-").every((p) => NUMBER_WORDS.has(p));
  const out: string[] = [];
  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    const inRun = out.at(-1) === "#";
    if (isNum(w)) {
      if (!inRun) out.push("#");
      continue;
    }
    // A joiner inside or right after a run, followed (soon) by a number or a money word, stays in the run.
    if (inRun && JOINERS.has(w)) {
      const ahead = words.slice(i + 1, i + 3);
      const half = ahead[0] === "half" || (ahead[0] === "a" && ahead[1] === "half");
      if (
        w === "dollars" ||
        w === "cents" ||
        w === "half" ||
        half ||
        ahead.some(isNum) ||
        ahead[0] === "cents"
      )
        continue;
    }
    out.push(w);
  }
  return out;
}

/** What the script should say for a site passage, by the registered rules. */
export function spokenForm(site: string, isCaption: boolean): string[] {
  let text = site;
  for (const n of NORMALIZATIONS) text = text.replace(n.from, n.to);
  text = text.replace(/\b(Jun|Jul|Aug|Dec)_MONTH/g, (_, m: string) => MONTHS[m]);
  return [...(isCaption ? ["photograph"] : []), ...numberRuns(text)];
}

/** Script passages that differ from the site in a way no registered rule explains. */
export function unregisteredDifferences(): {
  blocks: string[];
  site: string[];
  script: string[];
}[] {
  return matchScript().flatMap((p) => {
    const site = spokenForm(p.site, p.blocks[0].startsWith("plate-"));
    const script = numberRuns(p.script.replace(/^Photograph\.\s*/, "Photograph "));
    if (site.join(" ") === script.join(" ")) return [];
    let i = 0;
    while (site[i] === script[i]) i++;
    return [
      {
        blocks: p.blocks,
        site: site.slice(Math.max(0, i - 3), i + 6),
        script: script.slice(Math.max(0, i - 3), i + 6),
      },
    ];
  });
}
