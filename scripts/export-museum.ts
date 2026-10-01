/**
 * Writes the museum export to one folder and verifies it from the files alone.
 *
 *   node --experimental-strip-types --import ./scripts/test-register.mjs scripts/export-museum.ts [dir] [--with-media]
 *
 * Default folder: export/angie (ignored by git).
 */
import { exportMuseum, verifyExport } from "./lib/export.ts";

const args = process.argv.slice(2);
const dir = args.find((a) => !a.startsWith("--")) ?? "export/angie";
const result = exportMuseum(dir, { withMedia: args.includes("--with-media") });
const problems = verifyExport(dir);
if (problems.length) {
  console.error(
    `Export written but it does not stand alone (${problems.length}):\n- ${problems.join("\n- ")}`,
  );
  process.exit(1);
}
console.log(
  `exported ${result.files} files and ${result.media} media entries to ${dir}; verified from the files alone`,
);
