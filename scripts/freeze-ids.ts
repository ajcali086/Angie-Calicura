/**
 * Gives every block and plate that has no frozen id a new one, in
 * src/data/frozen-ids.json. Fills blanks only; never renumbers.
 *
 *   node --experimental-strip-types --import ./scripts/test-register.mjs scripts/freeze-ids.ts
 *
 * A new paragraph in chapter 2 gets the next number chapter 2 has never used
 * ("2-p56"), wherever it sits; a new plate the next plate number. Each id is
 * stored with the shortest opening (40 characters or more, to a word end)
 * that no other block starts with.
 */
import { writeFileSync } from "node:fs";
import { assigned, frozenIds, unfrozen } from "../src/data/article.ts";

if (!unfrozen.length) {
  console.log("every block and plate already has a frozen id");
  process.exit(0);
}

const used = [...frozenIds.blocks, ...frozenIds.plates].map(([id]) => id).concat(frozenIds.retired);

function nextId(kind: "blocks" | "plates", chapter: number): string {
  const pattern = kind === "plates" ? /^plate-(\d+)$/ : new RegExp(`^${chapter}-p(\\d+)$`);
  const max = Math.max(0, ...used.map((id) => Number(id.match(pattern)?.[1] ?? 0)));
  return kind === "plates" ? `plate-${String(max + 1).padStart(2, "0")}` : `${chapter}-p${max + 1}`;
}

function opening(kind: "blocks" | "plates", text: string): string {
  const others = assigned.filter((a) => a.kind === kind && a.text !== text).map((a) => a.text);
  if (assigned.filter((a) => a.kind === kind && a.text === text).length > 1)
    throw new Error(`two ${kind} have the same text: ${text.slice(0, 60)}`);
  for (let n = 40; n < text.length; n++) {
    if (text[n] !== " ") continue;
    const prefix = text.slice(0, n);
    if (!others.some((o) => o.startsWith(prefix))) return prefix;
  }
  if (others.some((o) => o.startsWith(text)))
    throw new Error(`another block starts with all of: ${text.slice(0, 60)}`);
  return text;
}

for (const u of unfrozen) {
  const id = nextId(u.kind, u.chapter);
  used.push(id);
  frozenIds[u.kind].push([id, opening(u.kind, u.text)]);
  console.log(`froze ${id}: ${u.text.slice(0, 60)}`);
}

const pairs = (list: [string, string][]) => list.map((p) => `    ${JSON.stringify(p)}`).join(",\n");
writeFileSync(
  new URL("../src/data/frozen-ids.json", import.meta.url),
  `{\n  "blocks": [\n${pairs(frozenIds.blocks)}\n  ],\n  "plates": [\n${pairs(frozenIds.plates)}\n  ],\n  "retired": ${JSON.stringify(frozenIds.retired)}\n}\n`,
);
console.log(`wrote src/data/frozen-ids.json (${unfrozen.length} new)`);
