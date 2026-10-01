/**
 * Adds every model ID not yet frozen to src/model/frozen.json. Fills blanks
 * only; never removes or renumbers. A withdrawn ID moves to `retired` by hand
 * and is never reused.
 *
 *   node --experimental-strip-types --import ./scripts/test-register.mjs scripts/freeze-model.ts
 */
import { readFileSync, writeFileSync } from "node:fs";
import { entities, evidence, questions, records } from "../src/model/index.ts";

const file = new URL("../src/model/frozen.json", import.meta.url);
type Frozen = {
  frozen_on: string;
  records: string[];
  entities: string[];
  questions: string[];
  evidence: string[];
  retired: string[];
};
let frozen: Frozen;
try {
  frozen = JSON.parse(readFileSync(file, "utf8"));
} catch {
  frozen = {
    frozen_on: new Date().toISOString().slice(0, 10),
    records: [],
    entities: [],
    questions: [],
    evidence: [],
    retired: [],
  };
}
const current = {
  records: records.map((r) => r.id),
  entities: entities.map((e) => e.id),
  questions: questions.map((q) => q.id),
  evidence: evidence.map((l) => l.id),
};
let added = 0;
for (const kind of ["records", "entities", "questions", "evidence"] as const)
  for (const id of current[kind]) {
    if (frozen.retired.includes(id)) throw new Error(`${id} is retired and may not be reused`);
    if (!frozen[kind].includes(id)) {
      frozen[kind].push(id);
      added++;
    }
  }
writeFileSync(file, JSON.stringify(frozen, null, 2) + "\n");
console.log(`froze ${added} new ID(s); ${Object.values(current).flat().length} in use`);
