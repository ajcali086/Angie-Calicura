/**
 * The sentence splitter the read-along uses, shared by the aligner
 * (scripts/align-audio.ts) and the chapter pages, so a cue and the sentence
 * it lights up always agree on where a sentence ends.
 *
 * Ported from spirit-of-martinez's scripts/lib/moments-align.mjs.
 */

/** Collapse whitespace runs to single spaces and trim. */
export const norm = (s: string) => s.replace(/[\s\u00a0]+/g, " ").trim();

/** The spoken text of a block: the post's markdown emphasis markers removed. */
export const spoken = (raw: string) => norm(raw.replace(/\*+/g, ""));

// Words that end in a period without ending the sentence.
const ABBREVIATIONS = new Set(
  (
    "mr mrs ms dr prof rev hon sen rep gov pres wm chas geo thos jas robt edw lieut " +
    "gen maj col lt capt sgt cpl pvt cmdr adm jr sr st ste mt ft " +
    "co corp inc ltd dept no nos vol vs etc approx ca cf " +
    "jan feb mar apr jun jul aug sept sep oct nov dec"
  ).split(" "),
);

/**
 * Split text into sentences. A boundary is . ! or ? (plus any closing quotes
 * or brackets), whitespace, then an uppercase letter, digit or opening quote
 * — unless the word before it is an initial ("L.G."), a dotted acronym or a
 * known abbreviation ("Mrs.").
 */
export function splitSentences(text: string): string[] {
  const t = norm(text);
  const out: string[] = [];
  let start = 0;
  const boundary = /([.!?]+)(["'”’)\]]*)\s+(?=["'“‘A-Z0-9$])/g;
  let m: RegExpExecArray | null;
  while ((m = boundary.exec(t))) {
    if (m[1] === ".") {
      const before = t.slice(start, m.index + 1);
      const word = before
        .split(/\s+/)
        .pop()!
        .replace(/^["'“‘(]+/, "");
      const bare = word.replace(/\.$/, "");
      const isInitial = /^[A-Z]$/.test(bare) || /^(?:[A-Z]\.)+[A-Z]$/.test(bare);
      const isAbbrev = ABBREVIATIONS.has(bare.toLowerCase()) && m[2] === "";
      if (isInitial || isAbbrev) continue;
    }
    const end = m.index + m[1].length + m[2].length;
    out.push(t.slice(start, end));
    start = m.index + m[0].length;
  }
  if (start < t.length) out.push(t.slice(start));
  return out;
}

/**
 * The same sentences, cut from the raw text so each keeps its own emphasis
 * markers. Returns null when a cut would fall inside an emphasis pair, in
 * which case the caller lights the whole block rather than guess.
 */
export function rawSentences(raw: string): string[] | null {
  const text = norm(raw);
  const plain = splitSentences(spoken(text));
  // Map each plain-text offset to its position in the raw text.
  const map: number[] = [];
  for (let i = 0; i < text.length; i++) if (text[i] !== "*") map.push(i);
  map.push(text.length);
  const out: string[] = [];
  let p = 0;
  let r = 0;
  const plainText = spoken(text);
  for (const s of plain) {
    const at = plainText.indexOf(s, p);
    if (at < 0) return null;
    p = at + s.length;
    let end = map[p];
    while (end < text.length && text[end] === "*") end++; // keep closing markers with their sentence
    const piece = text.slice(r, end).trim();
    if ((piece.match(/\*/g) ?? []).length % 2 !== 0) return null;
    out.push(piece);
    r = end;
  }
  return out;
}
