/**
 * Refuses a broken model before a build (npm "prebuild").
 *
 *   node --experimental-strip-types --import ./scripts/test-register.mjs scripts/check-model.ts
 */
import { audioToRegenerate, problems, provisionalIds } from "../src/model/validate.ts";

const found = problems();
if (found.length) {
  console.error(`The museum model has ${found.length} problem(s):\n- ${found.join("\n- ")}`);
  process.exit(1);
}
const provisional = provisionalIds();
if (provisional.length)
  console.log(
    `${provisional.length} new ID(s), frozen at first publish:\n- ${provisional.join("\n- ")}`,
  );
const stale = audioToRegenerate();
if (stale.length)
  console.log(
    `audio to regenerate for ${stale.length} applied correction(s):\n- ${stale.join("\n- ")}`,
  );
console.log("model ok");
