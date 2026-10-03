/**
 * Records a fingerprint of every frozen block and plate caption as
 * article.md says it, in src/data/published-text.json. The build then
 * refuses any change to article.md: the published text changes only by
 * correction (src/data/corrections.ts). Fills blanks only, for a block
 * frozen after the first run; never overwrites a fingerprint.
 *
 *   node --experimental-strip-types --import ./scripts/test-register.mjs scripts/snapshot-text.ts
 */
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { originalText } from "../src/data/article.ts";

const file = new URL("../src/data/published-text.json", import.meta.url);
let published: Record<string, string> = {};
try {
  published = JSON.parse(readFileSync(file, "utf8"));
} catch {
  // first run
}
let added = 0;
for (const [id, text] of originalText) {
  if (id.startsWith("unfrozen-") || published[id]) continue;
  published[id] = createHash("sha256").update(text).digest("hex").slice(0, 16);
  added++;
}
writeFileSync(file, JSON.stringify(published, null, 2) + "\n");
console.log(`fingerprinted ${added} new block(s); ${Object.keys(published).length} in all`);
