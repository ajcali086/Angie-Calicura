/**
 * snippetCard.ts — renders a shareable "story" image for one moment: a
 * plate, a rule, a kicker, the passage itself, and a quiet footer. Runs
 * entirely in the browser at share time.
 *
 * Ported from spirit-of-martinez. The plate page's SnippetCard shows it; the
 * "Share this moment" button (SharePassage) sends it with the passage's audio
 * clip, which is when the footer carries a Listen badge.
 *
 * The geometry and text-fitting below are pure functions — they take a
 * `measure` callback instead of touching a real canvas — so they're tested
 * with a fake measurer in snippetCard.test.ts. Only renderSnippetCard()
 * itself needs a live CanvasRenderingContext2D.
 */

export const SNIPPET_CARD_WIDTH = 1080;
export const SNIPPET_CARD_HEIGHT = 1350;

// The site's red-light tokens: ink ground, paper text, neon kicker. `footer`
// is lighter than the site's muted grey so the credit line keeps 4.5:1
// against the ink.
export const SNIPPET_CARD_COLORS = {
  ink: "#150809",
  inkMid: "#33151a",
  paper: "#f7e7de",
  brass: "#ff5a6c",
  footer: "#c9a9a3",
};

/** The card's last line. */
export const SNIPPET_CARD_SITE_LINE = "Angie · Michael Dykhorst · Sheridan Wyoming History";

// ------------------------------------------------------------ geometry ----

export type Rect = { x: number; y: number; w: number; h: number };

/**
 * The source and destination rectangles for a cover-fit `drawImage` call:
 * scale the source to fill the box, cropping whichever axis overflows.
 * Never distorts the image and never leaves the ground showing through.
 */
export function coverFit(
  srcW: number,
  srcH: number,
  boxW: number,
  boxH: number,
): { src: Rect; dst: Rect } {
  const dst: Rect = { x: 0, y: 0, w: boxW, h: boxH };
  if (srcW <= 0 || srcH <= 0 || boxW <= 0 || boxH <= 0) {
    return { src: { x: 0, y: 0, w: srcW, h: srcH }, dst };
  }
  const srcRatio = srcW / srcH;
  const boxRatio = boxW / boxH;
  let sw = srcW;
  let sh = srcH;
  if (srcRatio > boxRatio) {
    sw = srcH * boxRatio; // source is relatively wider: crop the sides
  } else if (srcRatio < boxRatio) {
    sh = srcW / boxRatio; // source is relatively taller: crop top and bottom
  }
  return {
    src: { x: (srcW - sw) / 2, y: (srcH - sh) / 2, w: sw, h: sh },
    dst,
  };
}

// ---------------------------------------------------------- text fitting ---

/** Measures the pixel width of `text` set at `sizePx`. Backed by a real
 * canvas context in production, a fake in tests. */
export type Measure = (text: string, sizePx: number) => number;

/** Greedy word wrap at `sizePx` against `maxWidth`. A single word wider than
 * `maxWidth` still gets its own line rather than looping forever. */
export function wrapLines(
  text: string,
  sizePx: number,
  maxWidth: number,
  measure: Measure,
): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (!line || measure(candidate, sizePx) <= maxWidth) {
      line = candidate;
    } else {
      lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

export type ShrinkResult = { size: number; lines: string[] };

/**
 * Steps the font size down from `from` to `to` (1px at a time) and returns
 * the largest size whose wrapped lines fit `maxHeight`. If nothing fits even
 * at the floor, returns the floor anyway: overflowing by a line reads better
 * than type too small to read at all. The 34px floor has not yet been
 * checked on a real phone — italic Cormorant that small is the risk.
 */
export function shrinkToFit(
  text: string,
  opts: {
    maxWidth: number;
    maxHeight: number;
    from?: number;
    to?: number;
    lineHeight?: number;
    measure: Measure;
  },
): ShrinkResult {
  const { maxWidth, maxHeight, from = 56, to = 34, lineHeight = 1.22, measure } = opts;
  let last: ShrinkResult = { size: to, lines: wrapLines(text, to, maxWidth, measure) };
  for (let size = from; size >= to; size--) {
    const lines = wrapLines(text, size, maxWidth, measure);
    if (lines.length * size * lineHeight <= maxHeight) {
      return { size, lines };
    }
    last = { size, lines };
  }
  return { size: to, lines: last.lines };
}

// ------------------------------------------------------------ the band ----

const FOOTER_HEIGHT = 108;
/** Band bottom to the passage's first line: kicker baseline (+64) then (+40). */
const KICKER_GAP = 104;
/** Enough for a 60-word passage (the hard cap) at the 34px floor. */
export const MIN_PASSAGE_HEIGHT = 260;

/**
 * How tall the plate's band is. A portrait plate gets a taller band so a crop
 * doesn't cut through a face — but never so tall that the passage has nowhere
 * to go: at the full 0.78 ratio only 85px was left, and a legal 53-word
 * passage bottomed out at the 34px floor and drew straight through the credit
 * and site lines. Reserve the passage's minimum first; the plate takes what's
 * left, up to its ratio.
 */
export function cardBandHeight(
  isPortrait: boolean,
  cardHeight: number = SNIPPET_CARD_HEIGHT,
): number {
  const wanted = Math.round(cardHeight * (isPortrait ? 0.78 : 0.6));
  const maxBand = cardHeight - FOOTER_HEIGHT - KICKER_GAP - MIN_PASSAGE_HEIGHT;
  return Math.min(wanted, maxBand);
}

// ------------------------------------------------------------- capping ----

const HARD_CAP_WORDS = 60;
const TARGET_WORDS = 45;

const wordCount = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;

export type CardTextResult =
  { ok: true; text: string; truncated: boolean } | { ok: false; reason: string };

/**
 * Cuts only at a sentence boundary, and never invents a sentence splitter:
 * `parts` must already be one or more whole sentences — SnippetCard never
 * re-segments raw paragraph text itself.
 *
 *   total <= 60 words          → shown in full, verbatim
 *   one sentence over 60 words → no card (too long to read as a card at all)
 *   several sentences, over 60 → the leading sentences that fit in ~45
 *                                 words, cut only at a sentence boundary,
 *                                 ending "…"
 */
export function fitCardText(
  parts: string[],
  opts: { hardCap?: number; target?: number } = {},
): CardTextResult {
  const hardCap = opts.hardCap ?? HARD_CAP_WORDS;
  const target = opts.target ?? TARGET_WORDS;
  const sentences = parts.map((p) => p.trim()).filter(Boolean);
  if (!sentences.length) return { ok: false, reason: "No text was given." };

  const total = sentences.reduce((n, s) => n + wordCount(s), 0);
  if (total <= hardCap) return { ok: true, text: sentences.join(" "), truncated: false };

  if (sentences.length === 1 || wordCount(sentences[0]) > hardCap) {
    // Either it's one long sentence, or the first of several is already too
    // long on its own — either way there's no safe truncation point.
    return { ok: false, reason: "This passage is too long for a card; share the link instead." };
  }

  const kept: string[] = [];
  let count = 0;
  for (const s of sentences) {
    const n = wordCount(s);
    if (count > 0 && count + n > target) break;
    kept.push(s);
    count += n;
  }
  if (!kept.length) {
    return { ok: false, reason: "This passage is too long for a card; share the link instead." };
  }
  return { ok: true, text: `${kept.join(" ")}…`, truncated: true };
}

// -------------------------------------------------------------- fonts -----

let fontsPrimed: Promise<void> | null = null;

/** Warms the two type sizes the card actually draws, then waits on
 * document.fonts.ready as a belt-and-suspenders fallback (the same pattern
 * useDoorDeconflict.ts already uses elsewhere in this codebase). Safe to
 * call from anywhere; never throws. */
export function loadCardFonts(): Promise<void> {
  if (typeof document === "undefined" || !("fonts" in document)) {
    return Promise.resolve();
  }
  if (!fontsPrimed) {
    fontsPrimed = Promise.all([
      document.fonts.load('italic 400 56px "Cormorant Garamond"'),
      document.fonts.load('italic 400 34px "Cormorant Garamond"'),
      document.fonts.load('600 22px "Outfit"'),
      document.fonts.load('400 18px "Outfit"'),
    ])
      .catch(() => undefined)
      .then(() => document.fonts.ready.catch(() => undefined))
      .then(() => undefined);
  }
  return fontsPrimed;
}

// -------------------------------------------------------------- render ----

export type SnippetCardInput = {
  /** Already loaded and decoded — this function never fetches an image. */
  plateImage: HTMLImageElement | null;
  /** Give the plate's image band more height so a portrait crop doesn't cut
   * through a face (ArchivePhoto.height > width flags this the same way
   * the plate pages already do). */
  plateIsPortrait?: boolean;
  /** The plate's own credit line, verbatim. Null on the chapter-image
   * fallback path, which isn't an ArchivePhoto and has nothing to credit. */
  credit: string | null;
  /** e.g. "Chapter 7 · Station 119 · 7.1 The Ground" — this function
   * uppercases and tracks it; pass it in title case. */
  kicker: string;
  /** One or more already-resolved sentence strings, in order. Not raw,
   * unsegmented paragraph text — see fitCardText(). */
  sentences: string[];
  /** "Listen · 0:42" when the share carries this passage's audio; drawn at
   * the footer's right. The badge only ever travels with the clip. */
  listen?: string | null;
};

function drawTracked(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  spacing: number,
): void {
  let cx = x;
  for (const ch of text) {
    ctx.fillText(ch, cx, y);
    cx += ctx.measureText(ch).width + spacing;
  }
}

/**
 * Renders one moment as a 1080×1350 canvas. Draw order is fixed: ink ground,
 * cover-fit plate, brass rule, tracked kicker, the passage (shrink-to-fit,
 * 56px down to a 34px floor), a quiet footer. Throws only when the text
 * itself can't be shown (see fitCardText) or the browser has no 2D canvas
 * context — the caller decides what to do then (fall back to a link share).
 *
 * The Listen badge is drawn only when the caller passes `listen`, which it
 * does only when the share also carries the passage's audio clip.
 */
export async function renderSnippetCard(input: SnippetCardInput): Promise<HTMLCanvasElement> {
  const fitted = fitCardText(input.sentences);
  if (!fitted.ok) throw new Error(fitted.reason);

  await loadCardFonts();

  const canvas = document.createElement("canvas");
  canvas.width = SNIPPET_CARD_WIDTH;
  canvas.height = SNIPPET_CARD_HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("This browser can't draw a 2D canvas.");

  const { ink, inkMid, paper, brass, footer } = SNIPPET_CARD_COLORS;
  const padX = 64;

  // 1. ink ground
  ctx.fillStyle = ink;
  ctx.fillRect(0, 0, SNIPPET_CARD_WIDTH, SNIPPET_CARD_HEIGHT);

  // 2. plate, cover-fit into the top band
  const bandH = cardBandHeight(Boolean(input.plateIsPortrait));
  if (input.plateImage) {
    const { src, dst } = coverFit(
      input.plateImage.naturalWidth,
      input.plateImage.naturalHeight,
      SNIPPET_CARD_WIDTH,
      bandH,
    );
    ctx.drawImage(input.plateImage, src.x, src.y, src.w, src.h, dst.x, dst.y, dst.w, dst.h);
  } else {
    ctx.fillStyle = inkMid;
    ctx.fillRect(0, 0, SNIPPET_CARD_WIDTH, bandH);
  }

  // 3. brass rule
  ctx.fillStyle = brass;
  ctx.fillRect(0, bandH, SNIPPET_CARD_WIDTH, 3);

  // 4. kicker
  ctx.fillStyle = brass;
  ctx.textBaseline = "alphabetic";
  ctx.font = '600 22px "Outfit", ui-sans-serif, system-ui, sans-serif';
  const kickerY = bandH + 64;
  drawTracked(ctx, input.kicker.toUpperCase(), padX, kickerY, 3);

  // 5. the passage, shrink-to-fit
  const textTop = kickerY + 40;
  const measure: Measure = (t, size) => {
    ctx.font = `italic 400 ${size}px "Cormorant Garamond", Georgia, serif`;
    return ctx.measureText(t).width;
  };
  const { size, lines } = shrinkToFit(fitted.text, {
    maxWidth: SNIPPET_CARD_WIDTH - padX * 2,
    maxHeight: SNIPPET_CARD_HEIGHT - FOOTER_HEIGHT - textTop,
    measure,
  });
  ctx.font = `italic 400 ${size}px "Cormorant Garamond", Georgia, serif`;
  ctx.fillStyle = paper;
  const lineHeight = size * 1.22;
  lines.forEach((line, i) => {
    ctx.fillText(line, padX, textTop + size + i * lineHeight);
  });

  // 6. footer — credit (when there is one), then the site line
  ctx.font = '400 18px "Outfit", ui-sans-serif, system-ui, sans-serif';
  ctx.fillStyle = footer;
  const siteY = SNIPPET_CARD_HEIGHT - 48;
  if (input.credit) ctx.fillText(input.credit, padX, siteY - 26);
  ctx.fillText(SNIPPET_CARD_SITE_LINE, padX, siteY);
  if (input.listen) {
    ctx.font = '600 20px "Outfit", ui-sans-serif, system-ui, sans-serif';
    ctx.fillStyle = brass;
    ctx.textAlign = "right";
    ctx.fillText(input.listen.toUpperCase(), SNIPPET_CARD_WIDTH - padX, siteY);
    ctx.textAlign = "left";
  }

  return canvas;
}
