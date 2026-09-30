import cuesJson from "../generated/cues.json" with { type: "json" };
import { article, chapters, plateById } from "./article.ts";
import { splitSentences, spoken } from "../lib/sentences.ts";

/**
 * The narration: five MP3 parts of the TTS script (source/audio-part-map.md),
 * and the read-along cues that tie each spoken sentence to the page.
 *
 * The script reads the article in order — title, subtitle, every passage and
 * every plate caption — so the spoken blocks are the article's blocks. The
 * parts break where the part map says each one ends. The recording was read
 * from source/narration-script.md, the article normalized for speech
 * (numbers written out, "Photograph." before each caption). Cues come from
 * scripts/align-audio.ts, which times each sentence by its length in that
 * script against the pauses in the audio; audio.test.ts and
 * narration.test.ts hold the structure and the pacing.
 */
export type PartId = "a1" | "a2a" | "a2b" | "a3a" | "a3b";

/** The narration is derived media and says so wherever it can be played. */
export const NARRATION = {
  label: "Synthetic voice",
  note: "Read by a synthetic (text-to-speech) voice from a script of the article prepared for speech. The highlighting is timed by estimate.",
};

export const PARTS: {
  id: PartId;
  src: string;
  /** Book part and, where the audio splits it, which half. From the part map. */
  title: string;
  /** The last block this part reads; null for the final part. */
  lastBlock: string | null;
}[] = [
  {
    id: "a1",
    src: "/audio/angie-a1.mp3",
    title: "Part One · Martinez Girlhood",
    lastBlock: "plate-08",
  },
  {
    id: "a2a",
    src: "/audio/angie-a2a.mp3",
    title: "Part Two · Wyoming Madame · The Ideal",
    lastBlock: "2-p27",
  },
  {
    id: "a2b",
    src: "/audio/angie-a2b.mp3",
    title: "Part Two · Wyoming Madame · The Fall",
    lastBlock: "2-p55",
  },
  {
    id: "a3a",
    src: "/audio/angie-a3a.mp3",
    title: "Part Three · Tahoe Restaurateur · Reinvention",
    lastBlock: "3-p13",
  },
  {
    id: "a3b",
    src: "/audio/angie-a3b.mp3",
    title: "Part Three · Tahoe Restaurateur · The Record",
    lastBlock: null,
  },
];

export type SpokenBlock = { id: string; chapter: string | null; raw: string };

/** Every block the narration reads, in order. */
export function spokenBlocks(): SpokenBlock[] {
  const out: SpokenBlock[] = [
    { id: "title", chapter: null, raw: article.title },
    { id: "subtitle", chapter: null, raw: article.subtitle },
  ];
  for (const c of chapters) {
    for (const b of c.blocks) {
      if (b.type === "figure")
        out.push({ id: b.plate, chapter: c.slug, raw: plateById(b.plate)!.caption });
      else if (b.type === "list") out.push({ id: b.id, chapter: c.slug, raw: b.items.join(". ") });
      else out.push({ id: b.id, chapter: c.slug, raw: b.text });
    }
  }
  return out;
}

/** The blocks each part reads. */
export function partBlocks(): Record<PartId, SpokenBlock[]> {
  const all = spokenBlocks();
  const out = {} as Record<PartId, SpokenBlock[]>;
  let k = 0;
  for (const part of PARTS) {
    const list: SpokenBlock[] = [];
    while (k < all.length) {
      const b = all[k++];
      list.push(b);
      if (b.id === part.lastBlock) break;
    }
    out[part.id] = list;
  }
  return out;
}

/** The sentences the aligner times for a block. */
export const blockSentences = (b: SpokenBlock) => splitSentences(spoken(b.raw));

export type Cue = { id: string; block: string; sentence: number; start: number; end: number };

type CueFile = Record<PartId, { duration: number; cues: [string, number, number][] }>;
const file = cuesJson as CueFile;

/** Cue id → block and sentence: "2-p14-s3", "plate-08-s0", "a1-title". */
function parseId(id: string): { block: string; sentence: number } {
  const m = id.match(/^(.*)-s(\d+)$/);
  return m ? { block: m[1], sentence: Number(m[2]) } : { block: id, sentence: -1 };
}

export const partCues: Record<PartId, Cue[]> = Object.fromEntries(
  PARTS.map((p) => [
    p.id,
    file[p.id].cues.map(([id, start, end]) => ({ id, ...parseId(id), start, end })),
  ]),
) as Record<PartId, Cue[]>;

export const partDuration = (id: PartId) => file[id].duration;

export const totalDuration = PARTS.reduce((t, p) => t + file[p.id].duration, 0);

/** The cue playing at `time`, holding the last one through the pause after it. */
export function cueAt(part: PartId, time: number): Cue | null {
  const cues = partCues[part];
  let lo = 0;
  let hi = cues.length - 1;
  let hit = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (cues[mid].start <= time) {
      hit = mid;
      lo = mid + 1;
    } else hi = mid - 1;
  }
  return hit < 0 ? null : cues[hit];
}

/** Where a block is read: its part and the time span of its sentences. */
export function blockWindow(block: string): { part: PartId; start: number; end: number } | null {
  for (const p of PARTS) {
    const cues = partCues[p.id].filter((c) => c.block === block);
    if (cues.length) return { part: p.id, start: cues[0].start, end: cues[cues.length - 1].end };
  }
  return null;
}

/** Which chapter page shows a block, for turning pages while following. */
const chapterOf = new Map(spokenBlocks().map((b) => [b.id, b.chapter]));
export const blockChapter = (block: string) => chapterOf.get(block) ?? null;

export function formatClock(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  return h
    ? `${h}:${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`
    : `${m}:${String(r).padStart(2, "0")}`;
}

/**
 * Where the narration is on the page: the chapter and block of the cue now
 * playing. The part's spoken title (and the article's title and subtitle,
 * which no chapter page shows) count as the part's first block that has a
 * page.
 */
export function readingPlace(
  part: PartId,
  cue: Pick<Cue, "block"> | null,
): { slug: string; hash: string } | null {
  const own = cue ? blockChapter(cue.block) : null;
  if (cue && own) return { slug: own, hash: cue.block };
  const first = partBlocks()[part].find((b) => b.chapter);
  return first ? { slug: first.chapter!, hash: first.id } : null;
}
