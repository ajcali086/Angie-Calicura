/**
 * Writes the CMS's generated files: public/admin/config.yml (from
 * src/cms/config.yml, its dropdowns filled from the model) and
 * public/admin/key.html (the ID key). Run by Vite as it starts
 * (vite.config.ts), so they are fresh on every dev start and build.
 *
 *   node --experimental-strip-types --import ./scripts/test-register.mjs scripts/cms-build.ts
 */
import { readFileSync, writeFileSync } from "node:fs";
import { relationships } from "../src/model/index.ts";
import { buildConfig, keyPage } from "./lib/cms.ts";

const root = new URL("../", import.meta.url);
const source = readFileSync(new URL("src/cms/config.yml", root), "utf8");
writeFileSync(new URL("public/admin/config.yml", root), buildConfig(source));
writeFileSync(new URL("public/admin/key.html", root), keyPage(relationships));
console.log("wrote public/admin/config.yml and public/admin/key.html");
