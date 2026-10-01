/**
 * Refuses a broken model before a build (npm "prebuild").
 *
 *   node --experimental-strip-types --import ./scripts/test-register.mjs scripts/check-model.ts
 */
import { problems } from "../src/model/validate.ts";

const found = problems();
if (found.length) {
  console.error(`The museum model has ${found.length} problem(s):\n- ${found.join("\n- ")}`);
  process.exit(1);
}
console.log("model ok");
