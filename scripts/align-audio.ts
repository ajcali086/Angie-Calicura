/**
 * Builds src/generated/cues.json: when each sentence is spoken in each part.
 *
 *   node --experimental-strip-types --import ./scripts/test-register.mjs scripts/align-audio.ts
 *
 * The recording was made from source/narration-script.md, so each sentence's
 * length is taken as spoken there (scripts/lib/narration.ts). This aligns by
 * pauses:
 *   1. decode each MP3 in headless Chromium (Node has no MP3 decoder) and take
 *      a 10 ms loudness envelope;
 *   2. find every pause of 120 ms or more;
 *   3. give each sentence of the part's text a pause to end on, by dynamic
 *      programming: a sentence's length in characters, at the part's speaking
 *      rate, predicts how long it takes, and longer pauses are preferred at
 *      paragraph ends. The rate is re-fitted from the result and the pass
 *      repeated.
 * Each part opens with a spoken title block ("Part Two. Wyoming Madame…")
 * that ends at the first pause of 0.8 s or more; it becomes the part's
 * "-title" cue.
 *
 * Needs playwright and a Chromium (PLAYWRIGHT_CHROMIUM or /opt/pw-browsers/chromium).
 */
import { readFileSync, writeFileSync } from "node:fs";
import { PARTS, blockSentences, partBlocks, type PartId } from "../src/data/audio.ts";
import { spokenLengths } from "./lib/narration.ts";

type Envelope = { duration: number; env: number[] };
type Pause = { start: number; end: number; dur: number };

async function envelopes(): Promise<Record<PartId, Envelope>> {
  const { chromium } = await import("playwright");
  const browser = await chromium.launch({
    executablePath: process.env.PLAYWRIGHT_CHROMIUM ?? "/opt/pw-browsers/chromium",
    args: ["--no-sandbox"],
  });
  const page = await browser.newPage();
  await page.route("http://audio.local/**", (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path === "/") return route.fulfill({ body: "<!doctype html>", contentType: "text/html" });
    return route.fulfill({
      body: readFileSync(new URL(`../public${path}`, import.meta.url)),
      contentType: "audio/mpeg",
    });
  });
  await page.goto("http://audio.local/");
  const out = {} as Record<PartId, Envelope>;
  for (const part of PARTS) {
    out[part.id] = await page.evaluate(async (src) => {
      const buf = await (await fetch(src)).arrayBuffer();
      const audio = await new OfflineAudioContext(1, 1, 24000).decodeAudioData(buf);
      const ch = audio.getChannelData(0);
      const hop = Math.round(audio.sampleRate / 100);
      const env: number[] = [];
      for (let i = 0; i + hop <= ch.length; i += hop) {
        let s = 0;
        for (let j = 0; j < hop; j++) s += ch[i + j] * ch[i + j];
        env.push(Math.sqrt(s / hop));
      }
      return { duration: audio.duration, env };
    }, `http://audio.local${part.src}`);
    console.log(`decoded ${part.id}: ${out[part.id].duration.toFixed(1)} s`);
  }
  await browser.close();
  return out;
}

function pauses(env: number[]): { pauses: Pause[]; voicedEnd: number } {
  const sorted = [...env].sort((a, b) => a - b);
  const threshold = Math.max(
    sorted[Math.floor(env.length * 0.05)] * 3,
    sorted[Math.floor(env.length * 0.6)] * 0.06,
  );
  const found: Pause[] = [];
  let from = -1;
  env.forEach((v, i) => {
    if (v < threshold) {
      if (from < 0) from = i;
    } else if (from >= 0) {
      if (i - from >= 12) found.push({ start: from / 100, end: i / 100, dur: (i - from) / 100 });
      from = -1;
    }
  });
  let last = env.length - 1;
  while (last > 0 && env[last] < threshold) last--;
  return { pauses: found, voicedEnd: (last + 1) / 100 };
}

function align(part: PartId, envelope: Envelope) {
  const { pauses: all, voicedEnd } = pauses(envelope.env);
  const title = all.find((p) => p.start < 8 && p.dur >= 0.8);
  const t0 = title ? title.end : 0;

  // Lengths as spoken, from the narration script (numbers written out and so
  // on), not as printed.
  const lengths = spokenLengths();
  const units: { id: string; chars: number; blockEnd: boolean }[] = [];
  for (const block of partBlocks()[part]) {
    const sentences = blockSentences(block);
    const spokenChars = lengths.get(block.id)!;
    sentences.forEach((_, i) =>
      units.push({
        id: `${block.id}-s${i}`,
        chars: spokenChars[i],
        blockEnd: i === sentences.length - 1,
      }),
    );
  }
  const n = units.length;
  const C: Pause[] = all
    .filter((p) => p.start > t0 + 0.5 && p.end < voicedEnd)
    .concat([{ start: voicedEnd, end: voicedEnd, dur: 2 }]);
  const m = C.length;
  const prefix = [0];
  for (const u of units) prefix.push(prefix[prefix.length - 1] + u.chars);
  const totalChars = prefix[n];

  let rate = totalChars / (voicedEnd - t0);
  let ends: number[] = [];
  for (let pass = 0; pass < 3; pass++) {
    const INF = Number.POSITIVE_INFINITY;
    const dp = Array.from({ length: n + 1 }, () => new Float64Array(m).fill(INF));
    const back = Array.from({ length: n + 1 }, () => new Int32Array(m).fill(-1));
    const startOf = (j: number) => (j < 0 ? t0 : C[j].end);
    for (let i = 1; i <= n; i++) {
      const u = units[i - 1];
      const expected = u.chars / rate;
      const cumulative = t0 + prefix[i] / rate;
      for (let j = 0; j < m; j++) {
        if (i === n && j !== m - 1) continue;
        if (Math.abs(C[j].start - cumulative) > 45 + 0.12 * (C[j].start - t0)) continue;
        const pauseScore = -(u.blockEnd ? 1.5 : 1) * Math.log(Math.min(C[j].dur, 1.5) / 0.15);
        const consider = (p: number) => {
          const before = p < 0 ? 0 : dp[i - 1][p];
          if (before === INF) return;
          const span = C[j].start - startOf(p);
          if (span <= 0.2) return;
          const cost = before + (span - expected) ** 2 / (expected + 1) + pauseScore;
          if (cost < dp[i][j]) {
            dp[i][j] = cost;
            back[i][j] = p;
          }
        };
        if (i === 1) consider(-1);
        else
          for (let p = j - 1; p >= 0 && C[j].start - C[p].end < expected * 2.5 + 3; p--)
            consider(p);
      }
    }
    if (dp[n][m - 1] === INF) throw new Error(`${part}: no alignment found`);
    ends = new Array(n);
    let j = m - 1;
    for (let i = n; i >= 1; i--) {
      ends[i - 1] = j;
      j = back[i][j];
    }
    const speaking = ends.reduce(
      (t, e, i) => t + (C[e].start - (i === 0 ? t0 : C[ends[i - 1]].end)),
      0,
    );
    rate = totalChars / speaking;
  }

  const round = (x: number) => Math.round(x * 100) / 100;
  const cues: [string, number, number][] = [[`${part}-title`, 0, round(t0)]];
  ends.forEach((e, i) => {
    const start = i === 0 ? t0 : C[ends[i - 1]].end;
    cues.push([units[i].id, round(start), round(C[e].start)]);
  });
  console.log(`aligned ${part}: ${n} sentences over ${m} pauses at ${rate.toFixed(1)} chars/s`);
  return { duration: round(envelope.duration), cues };
}

const env = await envelopes();
const out = Object.fromEntries(PARTS.map((p) => [p.id, align(p.id, env[p.id])]));
writeFileSync(
  new URL("../src/generated/cues.json", import.meta.url),
  `{\n${PARTS.map((p) => `"${p.id}":${JSON.stringify(out[p.id])}`).join(",\n")}\n}\n`,
);
console.log("wrote src/generated/cues.json");
