// Plain `node --test` has no bundler, so unlike Vite and tsc it doesn't
// resolve two things tsconfig.json allows everywhere else in this project:
// the "@/" -> "src/" path alias, and an extensionless import like
// "./cues" standing in for "./cues.ts" (moduleResolution: "bundler" plus
// allowImportingTsExtensions). Both are harmless as long as a test file's
// dependency chain only reaches them through `import type` (erased entirely
// by --experimental-strip-types, so never actually resolved at runtime) —
// but a real, value-level import blows up with ERR_MODULE_NOT_FOUND. That's
// what happened wiring nearestPlate.test.ts up to the real
// src/data/photos.ts, itself an alias import away from src/lib/og/pageMeta,
// and it turns out to already affect five existing test files too:
// cues.chapter4, cues.chapter10, sectionSeeks, continue, and srcset.
//
// This registers a resolve hook that does the same two rewrites Vite and
// tsc already do, so test files can pull in real production modules —
// including ones several imports deep — without each of those modules
// needing its own workaround.
//
// Usage:
//   node --experimental-strip-types --import ./scripts/test-register.mjs --test ...
import { register } from "node:module";

register(import.meta.url, import.meta.url);

const SRC_DIR = new URL("../src/", import.meta.url);
const HAS_EXTENSION = /\.[a-z]+$/i;
const TRY_EXTENSIONS = [".ts", ".tsx"];

export async function resolve(specifier, context, nextResolve) {
  const rewritten = specifier.startsWith("@/")
    ? new URL(specifier.slice(2), SRC_DIR).href
    : specifier;

  try {
    return await nextResolve(rewritten, context);
  } catch (err) {
    if (err?.code !== "ERR_MODULE_NOT_FOUND" || HAS_EXTENSION.test(rewritten)) {
      throw err;
    }
    for (const ext of TRY_EXTENSIONS) {
      try {
        return await nextResolve(rewritten + ext, context);
      } catch {
        // try the next extension
      }
    }
    throw err;
  }
}
