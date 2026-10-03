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
//
// It also stands in for Vite's `import.meta.glob`, which the model uses to
// read a folder of JSON files (one file per record, entity or question). A
// load hook rewrites the call to `globalThis.__glob`, defined below, which
// supports the one form the project uses: an eager glob of `dir/*.json`
// with `import: "default"`, keyed by path like Vite's.
import { readdirSync, readFileSync } from "node:fs";
import { register } from "node:module";

register(import.meta.url, import.meta.url);

globalThis.__glob = (base, pattern, options) => {
  const match = /^(\.{1,2}\/[^*]*?)\*\.json$/.exec(pattern);
  if (!match || options?.eager !== true || options?.import !== "default")
    throw new Error(`test-register: unsupported import.meta.glob(${JSON.stringify(pattern)})`);
  const dir = new URL(match[1], base);
  return Object.fromEntries(
    readdirSync(dir)
      .filter((f) => f.endsWith(".json"))
      .sort()
      .map((f) => [match[1] + f, JSON.parse(readFileSync(new URL(f, dir), "utf8"))]),
  );
};

export async function load(url, context, nextLoad) {
  const result = await nextLoad(url, context);
  if (!/\/src\/.*\.tsx?$/.test(url) || result.source == null) return result;
  const source = String(result.source);
  if (!source.includes("import.meta.glob(")) return result;
  return {
    ...result,
    source: source.replaceAll("import.meta.glob(", "globalThis.__glob(import.meta.url, "),
  };
}

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
